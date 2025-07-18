from converter.convertMaster import file_conversion_handler,merge_file_handler,get_upload_folder
import logging as logger
import concurrent.futures
import uuid,os

from flask import jsonify,current_app

def file_conversion_handler_with_context(data, app):
    """Wrapper to run file_conversion_handler with Flask app context"""
    with app.app_context():
        return file_conversion_handler(data)
    
def batch_conversion_handler(request):
    """Handle multiple file conversions in parallel"""
    try:
        import json
        
        # Get files and conversions data
        files = request.files.getlist('files')
        conversions_json = request.form.get('conversions')
        conversions = json.loads(conversions_json) if conversions_json else []
        
        if len(files) != len(conversions):
            return jsonify({'error': 'Number of files and conversions must match'}), 400
        
        # First, save all uploaded files and create conversion tasks
        conversion_tasks = []
        for i, (file, conversion) in enumerate(zip(files, conversions)):
            try:
                # Generate unique filename
                file_id = f"{uuid.uuid4().hex}.{file.filename.split('.')[-1].lower()}"
                file_path = os.path.join(get_upload_folder(), file_id)
                
                # Save the uploaded file
                file.save(file_path)
                
                # Create conversion task data
                task_data = {
                    'file_id': file_id,
                    'target_format': conversion['target_format'].lower(),
                    'password': conversion.get('password', None),
                    'compress_rate': conversion.get('compress_rate', None),
                    'conversion_type': conversion.get('conversion_type', 'full'),
                    'options': conversion.get('options', {}),
                    'original_filename': file.filename
                }
                conversion_tasks.append(task_data)
                
            except Exception as e:
                logger.error(f"Error saving file {file.filename}: {str(e)}")
                return jsonify({'error': f'Error saving file {file.filename}'}), 500
        
        # Now process conversions in parallel
        max_workers = min(len(conversion_tasks), 4)  # Limit to 4 parallel conversions
        
        results = []
        failed_conversions = []
        # Get current app context to pass to worker threads
        app = current_app._get_current_object()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all conversion tasks
            future_to_task = {
                executor.submit(file_conversion_handler_with_context, task, app): task 
                for task in conversion_tasks
            }
            
            # Collect results as they complete
            for future in concurrent.futures.as_completed(future_to_task):
                task = future_to_task[future]
                try:
                    result = future.result()
                    # result is a tuple (response, status_code)
                    if len(result) == 2 and result[1] == 200:
                        response_data = result[0].get_json()
                        results.append({
                            'original_name': task['original_filename'],
                            'conversion_id': response_data['conversion_id'],
                            'converted_name': f"{task['original_filename'].split('.')[0]}.{task['target_format']}",
                            'file_size': response_data['file_size'],
                            'target_format': response_data['target_format'],
                            'is_encrypted': response_data['is_encrypted']
                        })
                    else:
                        failed_conversions.append({
                            'file_name': task['original_filename'],
                            'error': result[0].get_json().get('error', 'Unknown error')
                        })
                except Exception as e:
                    failed_conversions.append({
                        'file_name': task['original_filename'],
                        'error': str(e)
                    })
        
        # Return results
        response = {
            'success': len(results) > 0,
            'files': results,
            'total_converted': len(results),
            'total_failed': len(failed_conversions)
        }
        
        if failed_conversions:
            response['failed_files'] = failed_conversions
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Batch conversion error: {str(e)}")
        return jsonify({'error': 'Batch conversion process failed'}), 500
    
def common_conversion_handler(request):
    """Handle file conversion"""
    try:
        # Check if it's a batch conversion (multiple files)
        if 'files' in request.files and 'conversions' in request.form:
            return batch_conversion_handler(request)
        # Single file conversion (existing logic)
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