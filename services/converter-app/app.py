import logging as logger
import os
import stripe
import uuid
from converter.license import generate_license_file
from converter.handlers import common_conversion_handler,common_merge_handler
from models.ip_log_pg import is_ip_under_limit,log_ip_address,change_max_allowed_request,log_user_payment,verify_user_payment,mark_successful_payment,get_session_info,get_account_limits
from models.s3 import generate_download_link
from flask import Blueprint,request,jsonify,redirect

cm_app_bp = Blueprint('cm_app_bp', __name__)

stripe.api_key = os.getenv("STRIPE_KEY",None)
stripe.ca_bundle_path = '/etc/ssl/certs/ca-certificates.crt'
APP_DOMAIN = os.getenv("APP_DOMAIN",'http://178.16.143.20:9080')

monthly_price_id=os.getenv('MONTHLY_PRICE_ID', None)
yearly_price_id=os.getenv('YEARLY_PRICE_ID', None)
daily_price_id=os.getenv('DAILY_PRICE_ID', None)


@cm_app_bp.route('/api/convert', methods=['POST'],endpoint='convert_file')
def convert_file_app():
    try:
        # Log caller IP (once per day)
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        logger.info(f"ipddress={ip_address}")
        # Get fingerprint from request (sent by the frontend)
        fingerprint = request.json.get('fingerprint')

        # Validate the fingerprint and usage limits
        if not fingerprint:
            return jsonify({'error': 'Fingerprint is required'}), 400

        if not is_ip_under_limit(ip_address,fingerprint):
            return jsonify({'error': 'Daily usage limit exceeded'}), 429
        log_ip_address(ip_address)
    except Exception as e:
        logger.exception(f"Caught exception {e}")
        return jsonify({'error': 'Conversion process failed'}), 500
    return common_conversion_handler(request)

@cm_app_bp.route('/api/merge', methods=['POST'],endpoint='merge_file')
def merge_file_app():
    try:
        # Log caller IP (once per day)
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        logger.info(f"ipddress={ip_address}")
        # Get fingerprint from request (sent by the frontend)
        fingerprint = request.json.get('fingerprint')

        # Validate the fingerprint and usage limits
        if not fingerprint:
            return jsonify({'error': 'Fingerprint is required'}), 400
        if not is_ip_under_limit(ip_address,fingerprint):
            return jsonify({'error': 'Daily usage limit exceeded'}), 429
        log_ip_address(ip_address)
    except Exception as e:
        logger.exception(f"Caught exception {e}")
        return jsonify({'error': 'Merge process failed'}), 500
    return common_merge_handler(request)

@cm_app_bp.route('/api/changeMaxReqest', methods=['POST'])
def max_request():
    try:
        # Log caller IP (once per day)
        max_request = request.values.get("max_request")
        if not max_request:
            return jsonify({'error': 'Max request is required'}), 429
        if change_max_allowed_request(max_request):
            return jsonify({'message':'Successfully changed max allowed conversions'}),200
    except Exception as e:
        logger.exception(f"Caught exception {e}")
    return jsonify({'error': 'Max Request change failed'}), 500
    
@cm_app_bp.route('/api/generateLicense',methods=['POST'])
def generate_license():
    print(request)
    duration = request.values.get('duration')
    logger.info(duration)
    if duration is None:
        duration = 30
    if isinstance(duration,str):
        try:
            duration=int(duration)
        except:
            return jsonify({'message':'Incorrect duration type'}), 400
    try:
        key = generate_license_file(expiry_days=duration)
        logger.info(f"key type={type(key)}")
        return jsonify({'key':key}),200
    except:
        return jsonify({'message':'Internal License generarion Error'}), 400
    
@cm_app_bp.route('/api/create-checkout-session', methods=['POST'])
def create_checkout_session():
    data = request.json
    email = data.get('email')
    plan = data.get('plan')  # 'monthly' or 'yearly'
    ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
    if not monthly_price_id or not yearly_price_id or not daily_price_id:
        return jsonify({'error':'Invalid Plan'}),400 
    
    price_id = {
        'monthly': monthly_price_id,
        'yearly': yearly_price_id,
        'daily': daily_price_id
    }.get(plan)
    logger.info("Using Stripe CA path:", stripe.ca_bundle_path)
    if not price_id:
        return jsonify({'error': 'Invalid plan'}), 400

    success_url=f'{APP_DOMAIN}/checkout-result?success=true&session_id={{CHECKOUT_SESSION_ID}}&plan={plan}'
    logger.info(success_url)
    try:
        client_ref_id = str(uuid.uuid4())
        stripe_mode = 'payment' if plan == 'daily' else 'subscription'
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            mode=stripe_mode,
            customer_email=email,
            client_reference_id=client_ref_id,
            line_items=[{
                'price': price_id,
                'quantity': 1
            }],
            success_url=success_url,
            cancel_url=f'{APP_DOMAIN}/checkout-result?canceled=true',
            metadata={
                'plan': plan,
                'ip_address': ip_address  # 👈 Custom metadata
            }
        )
        if not session:
            return jsonify({'message':'Session Creation Error'}),400
        
        if log_user_payment(session.id, email, plan, client_ref_id, 'pending'):
            return jsonify({'url': session.url})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    return ({'message':'Internal Server Error'}),400
    
@cm_app_bp.route('/api/checkout-session/<session_id>', methods=['GET'])
def get_checkout_session(session_id):
    return get_session_info(session_id)

endpoint_secret=os.getenv("STRIPE_ENDPOINT_SECRET",None)
@cm_app_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get('stripe-signature')
    if not endpoint_secret:
        return 'Incorrect Secret', 400
    logger.info("verifying webhook")
    
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except stripe.error.SignatureVerificationError:
        logger.error("Signature verification failed")
        return 'Signature verification failed.', 400
    logger.info(event)
    if 'type' in event and event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        session_id = session.get('id')
        email = session.get('customer_email')
        reference_id = session.get('client_reference_id')
        plan = session.get('metadata', {}).get('plan')
        ip_address = session.get('metadata', {}).get('ip_address')
        receipt = session.get('receipt_url')

        logger.debug(f"Payment completion process started for {email} ref: {reference_id}")

        return mark_successful_payment(session_id,plan,ip_address,receipt)
    return '',400

@cm_app_bp.route('/api/verifypayment', methods=['POST'])
def verify_payment():
    data = request.json
    email = data.get('email')
    plan = data.get('plan')

    if not email or not plan:
        return jsonify({'error': 'Email and plan are required'}), 400
    return verify_user_payment(email,plan)

@cm_app_bp.route('/api/account-limits', methods=['GET'])
def account_limits():
    ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    return get_account_limits(ip)

@cm_app_bp.route("/api/get-download-link", methods=["POST"])
def get_download_link():
    data = request.get_json()
    key = data.get("key")

    if not key:
        return jsonify({"error": "Missing download key"}), 400
    return generate_download_link(key)
    
if __name__ == "__main__":
    app.run(debug=True)
