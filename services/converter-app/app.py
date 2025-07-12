import logging as logger
import os
import stripe
import uuid
from converter.license import generate_license_file,generate_unique_license_id
from converter.handlers import common_conversion_handler,common_merge_handler
from models.ip_log_pg import is_ip_under_limit,log_ip_address,change_max_allowed_request,log_user_payment
from models.ip_log_pg import verify_user_payment,mark_successful_payment,get_session_info,get_account_limits
from models.ip_log_pg import get_download_records,store_license,insert_contact_data,validate_online_user
from models.ip_log_pg import save_successful_payment,payment_received
from models.s3 import generate_download_link
from flask import Blueprint,request,jsonify

cm_app_bp = Blueprint('cm_app_bp', __name__)

stripe.api_key = os.getenv("STRIPE_KEY",None)
stripe.ca_bundle_path = '/etc/ssl/certs/ca-certificates.crt'
APP_DOMAIN = os.getenv("APP_DOMAIN",'http://localhost:3000')

monthly_online_price_id=os.getenv('MONTHLY_ONLINE_PRICE_ID', None)
yearly_online_price_id=os.getenv('YEARLY_ONLINE_PRICE_ID', None)
monthly_offline_price_id=os.getenv('MONTHLY_OFFLINE_PRICE_ID', None)
yearly_offline_price_id=os.getenv('YEARLY_OFFLINE_PRICE_ID', None)
daily_price_id=os.getenv('DAILY_PRICE_ID', None)


@cm_app_bp.route('/api/convert', methods=['POST'],endpoint='convert_file')
def convert_file_app():
    try:
        # Log caller IP (once per day)
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        #logger.info(f"ipddress={ip_address}")
        # Get fingerprint from request (sent by the frontend)
        fingerprint = request.json.get('fingerprint')

        # Validate the fingerprint and usage limits
        if not fingerprint:
            return jsonify({'error': 'Fingerprint is required'}), 400

        if not is_ip_under_limit(fingerprint):
            return jsonify({'error': 'Daily usage limit exceeded'}), 429
        log_ip_address(ip_address,fingerprint)
    except Exception as e:
        logger.exception(f"Caught exception {e}")
        return jsonify({'error': 'Conversion process failed'}), 500
    return common_conversion_handler(request)

@cm_app_bp.route('/api/merge', methods=['POST'],endpoint='merge_file')
def merge_file_app():
    try:
        # Log caller IP (once per day)
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        #logger.info(f"ipddress={ip_address}")
        # Get fingerprint from request (sent by the frontend)
        fingerprint = request.form.get('fingerprint')
        #logger.info(f"fingerprint={fingerprint}")
        # Validate the fingerprint and usage limits
        if not fingerprint:
            return jsonify({'error': 'Fingerprint is required'}), 400
        if not is_ip_under_limit(fingerprint):
            return jsonify({'error': 'Daily usage limit exceeded'}), 429
        log_ip_address(ip_address,fingerprint)
    except Exception as e:
        logger.exception(f"Caught exception {e}")
        return jsonify({'error': 'Merge process failed'}), 500
    return common_merge_handler(request)

@cm_app_bp.route('/api/validateUser', methods=['POST'])
def login_online_user():
    data = request.get_json()
    license_id = data.get('licenseId')
    fingerprint = data.get('fingerprint')
    email = data.get('email')
    ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
    return validate_online_user(license_id,ip_address,fingerprint,email)
    
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
    data = request.get_json()
    duration = data.get('duration', 30)
    license_id = data.get('licenseId')
    redownload = data.get('redownload', False)
    sessionId = data.get('sessionId')
    email = data.get('email')
    plan = data.get('plan')
    platform = data.get('os')
    
    logger.info(f"Duration: {duration}, LicenseId: {license_id}, Redownload: {redownload}")
    if isinstance(duration,str):
        try:
            duration=int(duration)
        except:
            return jsonify({'message':'Incorrect duration type'}), 400
    try:
        # If it's a redownload request with existing license ID
        if redownload and license_id:
            existing_license = get_download_records(session_id=sessionId, email=email, plan=plan,platform=platform)
            if existing_license:
                logger.info(f"Returning existing license for ID: {license_id}")
                return jsonify({
                    'key': existing_license['key'],
                    'licenseId': license_id
                }), 200
        lic = generate_license_file(expiry_days=duration)
        # Store the license for future redownloads
        store_license(lic['license_id'], lic['key'],sessionId,email,plan,platform)
        return jsonify({
            'key': lic['key'],
            'licenseId': lic['license_id']
        }), 200
    except:
        return jsonify({'message':'Internal License generarion Error'}), 400

@cm_app_bp.route('/api/check-download-status', methods=['POST'])
def check_download_status():
    try:
        # Get data from the request
        data = request.get_json()
        session_id = data.get('sessionId')
        email = data.get('email')
        plan = data.get('plan')
        
        # Query your database for existing downloads
        download_records = get_download_records(session_id=session_id, email=email, plan=plan)
        if isinstance(download_records, list) and all(isinstance(record, dict) for record in download_records):
            if download_records:
                downloaded_platforms = [record['platform'] for record in download_records]
                license_id = download_records[0]['licenseId']
                return jsonify({
                    'hasDownloaded': True,
                    'downloadedPlatforms': downloaded_platforms,
                    'licenseId': license_id
                })
            else:
                return jsonify({
                    'hasDownloaded': False,
                    'downloadedPlatforms': [],
                    'licenseId': None
                })
        
    except Exception as error:
        return jsonify({'error': str(error)}), 500

@cm_app_bp.route('/api/create-checkout-session', methods=['POST'])
def create_checkout_session():
    data = request.json
    email = data.get('email')
    plan = data.get('plan')  # 'monthly' or 'yearly'
    plan_type = data.get('plan_type')
    fingerprint = data.get('fingerprint')
    ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
    if not monthly_online_price_id or not yearly_online_price_id or not monthly_offline_price_id or not yearly_offline_price_id or not daily_price_id:
        return jsonify({'error':'Invalid Plan'}),400 
    if not plan or not plan_type:
        return jsonify({'error':' Invalid Plan or PlanType'}),400
    price_id = {
        'monthly': { 'Online': monthly_online_price_id, 'Offline': monthly_offline_price_id},
        'yearly': {'Online': yearly_online_price_id, 'Offline': yearly_offline_price_id},
        'daily': { 'Online': daily_price_id}
    }.get(plan, {}).get(plan_type)
    #logger.info("Using Stripe CA path:", stripe.ca_bundle_path)
    if not price_id:
        return jsonify({'error': 'Invalid plan'}), 400

    success_url=f'{APP_DOMAIN}/checkout-result?success=true&session_id={{CHECKOUT_SESSION_ID}}&plan={plan}&planType={plan_type}'
    logger.info(success_url)
    try:
        client_ref_id = str(uuid.uuid4())
        stripe_mode = 'payment' #if plan == 'daily' else 'subscription'
        plan_metadata={
                'plan': plan,
                'plan_type':plan_type,
                'ip_address': ip_address,  # 👈 Custom metadata
                'fingerprint': fingerprint
        }
        if plan_type == 'Online':
            plan_metadata['license_id']=generate_unique_license_id()
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
            metadata=plan_metadata
        )
        if not session:
            return jsonify({'message':'Session Creation Error'}),400
        
        if log_user_payment(ip_address,session.id, email, plan, plan_type, client_ref_id, 'pending'):
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
    if 'type' in event and event['type'] == 'checkout.session.completed':
        logger.info(f"checkout_session.complete {event}")
        session = event['data']['object']
        session_id = session.get('id')
        email = session.get('customer_email')
        amount = session.get('amount_total')
        payment_intent = session.get('payment_intent')
        #reference_id = session.get('client_reference_id')
        #plan = session.get('metadata', {}).get('plan')
        plan_type = session.get('metadata', {}).get('plan_type')
        #ip_address = session.get('metadata', {}).get('ip_address')
        fingerprint = session.get('metadata', {}).get('fingerprint')
        license_id = None
        if plan_type == 'Online':
            license_id = session.get('metadata', {}).get('license_id')
        if amount is not None:
            amount = amount / 100.0  # Dividing by 100 to convert cents to dollars
        else:
            amount = 0.0 
        (msg,status) = save_successful_payment(session_id,None,license_id,fingerprint,amount,payment_intent)
        if status!=200:
            return (msg,status)
        (row,status) = payment_received(payment_intent)
        if status:
            # Save the payment details and send the email
            return mark_successful_payment(row,payment_intent)
    elif event['type'] == 'charge.updated':
            logger.info(f"charge.succeed {event}")
            session = event['data']['object']
            payment_intent = session.get('payment_intent')
            amount = session.get('amount')
            receipt = session.get('receipt_url')  # Directly get the receipt_url from the payment_intent object

            if receipt:
                (msg,status) = save_successful_payment(None,receipt,None,None,None,payment_intent)
                if status!=200:
                    return (msg,status)
                (row,status) = payment_received(payment_intent)
                if status:
                    # Save the payment details and send the email
                    return mark_successful_payment(row,payment_intent)
    #else:
     #   logger.info(f"other {event}")
    
    return '',400

@cm_app_bp.route('/api/verifypayment', methods=['POST'])
def verify_payment():
    data = request.json
    email = data.get('email')
    plan = data.get('plan')
    plan_type = data.get('plan_type')

    if not email or not plan or not plan_type:
        return jsonify({'error': 'Email and plan and plan_type are required'}), 400
    return verify_user_payment(email,plan, plan_type)

@cm_app_bp.route('/api/account-limits', methods=['GET'])
def account_limits():
    ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    # Get fingerprint from request (sent by the frontend)
    fingerprint = request.values.get('fp')

    # Validate the fingerprint and usage limits
    if not fingerprint:
        return jsonify({'error': 'Fingerprint is required'}), 400
    return get_account_limits(fingerprint=fingerprint)

@cm_app_bp.route("/api/get-download-link", methods=["POST"])
def get_download_link():
    data = request.get_json()
    key = data.get("key")

    if not key:
        return jsonify({"error": "Missing download key"}), 400
    return generate_download_link(key)

# API route to handle "Contact Us" form submissions
@cm_app_bp.route('/api/contact', methods=['POST'])
def submit_contact():
    try:
        data = request.get_json()
        
        # Insert contact data into database
        contact_id = insert_contact_data(
            data['firstName'],
            data['lastName'], 
            data['email'],
            data.get('phone', ''),
            data['subject'],
            data['message']
        )
        
        return jsonify({
            'success': True,
            'message': 'Contact form submitted successfully',
            'contact_id': contact_id
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error submitting contact form',
            'error': str(e)
        }), 500