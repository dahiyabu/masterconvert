from converter.convertMaster import FORMAT_COMPATIBILITY,FILE_CATEGORIES,merge_file_handler,upload_file_handler,get_converted_folder
import logging as logger
from converter.handlers import common_conversion_handler
from flask import Blueprint,request,jsonify, send_file
import os,sys

cm_bp = Blueprint('cm_bp', __name__)

CURR_DIR=os.path.join(os.path.dirname(__file__))
# Initialize Flask app

cli = sys.modules.get('flask.cli')
if cli:
    cli.show_server_banner = lambda *args, **kwargs: None

@cm_bp.route('/api/formats', methods=['GET'])
def get_formats():
    """Get all supported formats and their compatibility"""
    return jsonify({
        'format_compatibility': FORMAT_COMPATIBILITY,
        'file_categories': FILE_CATEGORIES
    }), 200

# Error handlers
@cm_bp.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Resource not found'}), 404

@cm_bp.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Server error occurred'}), 500

@cm_bp.route('/api/merge', methods=['POST'])
def merge_files():
    if 'files' not in request.files:
        return jsonify({"error": "No files provided."}), 400

    files = request.files.getlist('files')
    merge_type = request.form.get('merge_type', 'pdf')
    password = request.form.get('password',None)
    return merge_file_handler(files,merge_type,password)

# API Routes
@cm_bp.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle file upload and return compatible formats"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    return upload_file_handler(file)

@cm_bp.route('/api/convert', methods=['POST'])
def convert_file():
    logger.info("common conversion called")
    return common_conversion_handler(request)

@cm_bp.route('/api/download/<conversion_id>', methods=['GET'])
def download_file(conversion_id):
    """Download a converted file"""
    try:
        file_path = os.path.join(get_converted_folder(), conversion_id)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        # Get original filename from request query params or use conversion_id
        original_name = request.args.get('name', conversion_id)
        
        # Handle file download
        return send_file(
            file_path,
            download_name=original_name,
            as_attachment=True
        )
        
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        return jsonify({'error': 'Download failed'}), 500