from converter.init import logger
from converter.license import generate_license_file
import os
from flask import Blueprint,request,jsonify

cm_app_bp = Blueprint('cm_app_bp', __name__)

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