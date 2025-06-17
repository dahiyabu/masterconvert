import logging as logger
from converter.license import generate_license_file
from converter.handlers import common_conversion_handler
from models.ip_log import is_ip_under_limit,log_ip_address,change_max_allowed_request
from flask import Blueprint,request,jsonify

cm_app_bp = Blueprint('cm_app_bp', __name__)

@cm_app_bp.route('/api/convert', methods=['POST'],endpoint='convert_file')
def convert_file_app():
    try:
        # Log caller IP (once per day)
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        logger.info(f"ipddress={ip_address}")
        if not is_ip_under_limit(ip_address):
            return jsonify({'error': 'Daily usage limit exceeded'}), 429
        log_ip_address(ip_address)
    except Exception as e:
        logger.exception(f"Caught exception {e}")
        return jsonify({'error': 'Conversion process failed'}), 500
    return common_conversion_handler(request)

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