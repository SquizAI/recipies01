from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import recipe_extractor
import os

app = Flask(__name__)
CORS(app)

@app.route('/api/extract', methods=['POST'])
def extract_recipe():
    try:
        data = request.json
        url = data.get('url')
        if not url:
            return jsonify({'error': 'URL is required'}), 400

        # Extract video content and transcription
        video_data = recipe_extractor.download_and_transcribe_video(url)
        
        # Get post content
        content = recipe_extractor.extract_instagram_content(url)
        if not content:
            return jsonify({'error': 'Could not access Instagram content'}), 400
        
        # Add transcription to content
        content['transcription'] = video_data.get('transcription') if video_data else None
        
        # Parse recipe
        recipe = recipe_extractor.parse_recipe_content(content)
        if not recipe:
            return jsonify({'error': 'Could not create recipe'}), 400

        # Generate shopping list
        shopping_list = recipe_extractor.generate_shopping_list(recipe)
        recipe.shopping_list = shopping_list
        
        # Generate thumbnail if image available
        if content['image_url']:
            thumbnail_path = recipe_extractor.generate_thumbnail(recipe, content['image_url'])
            recipe.thumbnail_url = thumbnail_path

        return jsonify(recipe.dict())

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pdf', methods=['POST'])
def generate_pdf():
    try:
        data = request.json
        recipe = recipe_extractor.Recipe(**data)
        pdf_filename = recipe_extractor.export_recipe_pdf(recipe, recipe.thumbnail_url)
        
        if not pdf_filename:
            return jsonify({'error': 'Failed to generate PDF'}), 500

        return send_file(
            pdf_filename,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"recipe_{recipe.title.lower().replace(' ', '_')}.pdf"
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)