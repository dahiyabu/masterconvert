from flask import request,jsonify
from converter.app import app
from converter.init import logger
from converter.license import generate_license_file

@app.route('/generateLicense',methods=['POST'])
def generate_license():
    duration = request.values.get('duration')
    if duration is None:
        duration = 30
    if isinstance(duration,str):
        try:
            duration=int(duration)
        except:
            return jsonify({'message':'Incorrect duration type'}), 400
    try:
        key = generate_license_file(expiry_days=duration)
        return jsonify({'key':key}),200
    except:
        return jsonify({'message':'Internal License generarion Error'}), 400