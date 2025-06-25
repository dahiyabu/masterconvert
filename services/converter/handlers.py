from converter.convertMaster import file_conversion_handler,merge_file_handler
import logging as logger
from flask import jsonify

def common_conversion_handler(request):
    """Handle file conversion"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['file_id', 'target_format']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        return file_conversion_handler(data)
    except Exception as e:
        logger.exception(f"caught exception {e}")
        return jsonify({'error': 'Conversion process failed'}), 500
    
def common_merge_handler(request):
    if 'files' not in request.files:
        return jsonify({"error": "No files provided."}), 400

    files = request.files.getlist('files')
    merge_type = request.form.get('merge_type', 'pdf')
    password = request.form.get('password',None)
    return merge_file_handler(files,merge_type,password)