

import os
import time
import tempfile
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from openai import OpenAI
from IPython.display import HTML, display, Image, clear_output
from google.colab import userdata, files
import requests
import json
import re
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import yt_dlp
from moviepy.editor import VideoFileClip
from PIL import Image as PILImage, ImageDraw, ImageFont
from io import BytesIO
from fpdf import FPDF

# Structured Data Models
class MacroNutrients(BaseModel):
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    sugar_g: float
    saturated_fat_g: float
    protein_percentage: float
    carbs_percentage: float
    fat_percentage: float

class ShoppingItem(BaseModel):
    name: str
    amount: float
    unit: str
    category: str
    store_section: str

class Ingredient(BaseModel):
    name: str
    amount: float
    unit: str
    notes: Optional[str]
    category: str
    macro_contribution: Optional[Dict[str, float]]
    shopping_info: Optional[ShoppingItem]

class CookingStep(BaseModel):
    order: int
    instruction: str
    duration_minutes: Optional[int]
    temperature: Optional[str]
    tips: Optional[str]
    equipment_needed: List[str]

class Recipe(BaseModel):
    title: str
    description: str
    cuisine_type: str
    difficulty: str
    servings: int
    prep_time: int
    cook_time: int
    total_time: int
    ingredients: List[Ingredient]
    steps: List[CookingStep]
    macros: MacroNutrients
    equipment_needed: List[str]
    tags: List[str]
    tips_and_tricks: List[str]
    storage_instructions: str
    reheating_instructions: str
    variations: List[str]
    calories_per_serving: int
    cost_estimate: float
    shopping_list: List[ShoppingItem]
    source_url: Optional[str]
    video_transcription: Optional[str]
    thumbnail_url: Optional[str]
    created_at: str
    # Initialize OpenAI
try:
    OPENAI_API_KEY = userdata.get('OPENAI_API_KEY')
    if not OPENAI_API_KEY:
        raise ValueError("OpenAI API key not found")
    client = OpenAI(api_key=OPENAI_API_KEY)
    print("✅ OpenAI API initialized")
except Exception as e:
    print("\n⚠️ OpenAI API Key Error!")
    print("Add your key to Colab secrets:")
    print("1. Click folder icon → key icon")
    print("2. Add: Name: OPENAI_API_KEY")
    print("   Value: your-openai-api-key")
    raise e

# Initialize Chrome
chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--disable-gpu')
chrome_options.add_argument('--window-size=1920x1080')
driver = webdriver.Chrome(options=chrome_options)
print("✅ Chrome initialized")

def download_and_transcribe_video(url: str) -> dict:
    """Download and transcribe Instagram video with enhanced error handling"""
    try:
        print("🎥 Downloading video...")
        with tempfile.TemporaryDirectory() as temp_dir:
            video_path = os.path.join(temp_dir, 'video.mp4')
            audio_path = os.path.join(temp_dir, 'audio.mp3')
            
            ydl_opts = {
                'format': 'best[ext=mp4]',
                'outtmpl': video_path,
                'quiet': True,
                'retries': 5,
                'fragment_retries': 5
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

            if not os.path.exists(video_path):
                raise FileNotFoundError("Video download failed")

            print("🎵 Extracting audio...")
            video = VideoFileClip(video_path)
            
            if video.audio is None:
                print("⚠️ No audio found in video")
                video.close()
                return {'transcription': None, 'duration': video.duration}

            video.audio.write_audiofile(audio_path, verbose=False, logger=None)
            duration = video.duration
            video.close()

            print("🎙️ Transcribing audio...")
            with open(audio_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )

            return {
                'transcription': transcript,
                'duration': duration
            }

    except Exception as e:
        print(f"⚠️ Video processing error: {str(e)}")
        return {'transcription': None, 'duration': None}

def extract_instagram_content(url: str) -> dict:
    """Extract content from Instagram post with enhanced image selection"""
    try:
        print("📱 Accessing Instagram post...")
        driver.get(url)
        time.sleep(5)

        # Extract image with multiple selectors and prioritize article image
        image_url = None
        
        # Try to find the main article image first
        try:
            article = driver.find_element(By.TAG_NAME, "article")
            images = article.find_elements(By.TAG_NAME, "img")
            for img in images:
                src = img.get_attribute('src')
                if src and ('scontent' in src or 'cdninstagram' in src):
                    # Skip profile pictures which are usually small
                    width = img.get_attribute('width')
                    height = img.get_attribute('height')
                    if width and height:
                        if int(width) > 200 and int(height) > 200:
                            image_url = src
                            break
        except:
            pass

        # Fallback selectors if article image not found
        if not image_url:
            selectors = [
                "img[class*='x5yr21d']",
                "img[class*='_aagt']",
                "img[decoding='sync'][style*='width']",
                "img[class*='_aa1d']",
                "img[class*='_aagv']"
            ]
            
            for selector in selectors:
                try:
                    elements = driver.find_elements(By.CSS_SELECTOR, selector)
                    for elem in elements:
                        src = elem.get_attribute('src')
                        if src and ('scontent' in src or 'cdninstagram' in src):
                            # Check image dimensions if available
                            width = elem.get_attribute('width')
                            height = elem.get_attribute('height')
                            if width and height:
                                if int(width) > 200 and int(height) > 200:
                                    image_url = src
                                    break
                    if image_url:
                        break
                except:
                    continue

        # Extract text content with multiple methods
        text_content = ""
        try:
            # Method 1: Article text
            article = driver.find_element(By.TAG_NAME, "article")
            text_content = article.text
        except:
            try:
                # Method 2: Caption elements
                elements = driver.find_elements(By.CSS_SELECTOR, "div._a9zs")
                text_content = "\n".join([elem.text for elem in elements])
            except:
                try:
                    # Method 3: Body text as fallback
                    text_content = driver.find_element(By.TAG_NAME, "body").text
                except Exception as e:
                    print(f"⚠️ Text extraction failed: {str(e)}")

        if not image_url:
            print("⚠️ Could not find recipe image")

        return {
            'image_url': image_url,
            'text_content': text_content,
            'url': url
        }

    except Exception as e:
        print(f"⚠️ Content extraction error: {str(e)}")
        return None

def generate_thumbnail(recipe: Recipe, image_url: str) -> str:
    """Generate recipe thumbnail with enhanced font handling and image focus"""
    try:
        print("🎨 Creating thumbnail...")
        if not image_url:
            print("⚠️ No image URL provided")
            return None
            
        response = requests.get(image_url)
        img = PILImage.open(BytesIO(response.content))
        
        # Set dimensions maintaining aspect ratio
        target_width = 1280
        target_height = 720
        
        # Calculate new dimensions preserving aspect ratio
        width_ratio = target_width / img.width
        height_ratio = target_height / img.height
        
        if width_ratio < height_ratio:
            new_width = target_width
            new_height = int(img.height * width_ratio)
        else:
            new_height = target_height
            new_width = int(img.width * height_ratio)
            
        # Resize image
        img = img.resize((new_width, new_height), PILImage.LANCZOS)
        
        # Create new image with target dimensions
        background = PILImage.new('RGB', (target_width, target_height), (255, 255, 255))
        
        # Calculate position to center image
        x = (target_width - new_width) // 2
        y = (target_height - new_height) // 2
        
        # Paste resized image onto background
        background.paste(img, (x, y))
        img = background
        
        # Create overlay for text
        overlay = PILImage.new('RGBA', (target_width, target_height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        
        # Add gradient overlay at bottom only
        gradient_height = target_height // 3
        for i in range(gradient_height):
            alpha = int(255 * (i / gradient_height))
            y_position = target_height - gradient_height + i
            draw.rectangle([(0, y_position), (target_width, y_position+1)], 
                         fill=(0, 0, 0, alpha))
        
        # Try multiple font paths
        font_paths = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "arial.ttf"  # Fallback to system Arial
        ]
        
        # Get title font
        title_font = None
        for path in font_paths:
            try:
                title_font = ImageFont.truetype(path, 48)
                break
            except:
                continue
        
        if not title_font:
            print("⚠️ Using default font for title")
            title_font = ImageFont.load_default()
            
        # Get macro font
        macro_font = None
        for path in font_paths:
            try:
                macro_font = ImageFont.truetype(path, 32)
                break
            except:
                continue
        
        if not macro_font:
            print("⚠️ Using default font for macros")
            macro_font = ImageFont.load_default()

        # Add title with shadow effect for better readability
        title_y = target_height - 140
        words = recipe.title.split()
        lines = []
        current_line = []
        
        for word in words:
            current_line.append(word)
            line_text = ' '.join(current_line)
            bbox = title_font.getbbox(line_text)
            line_width = bbox[2] - bbox[0] if bbox else 0
            
            if line_width > target_width - 80:
                if len(current_line) > 1:
                    current_line.pop()
                    lines.append(' '.join(current_line))
                    current_line = [word]
                else:
                    lines.append(line_text)
                    current_line = []
        
        if current_line:
            lines.append(' '.join(current_line))

        # Draw title lines with shadow
        for line in lines:
            # Draw shadow
            draw.text((42, title_y+2), line, font=title_font, fill='black')
            # Draw text
            draw.text((40, title_y), line, font=title_font, fill='white')
            title_y += 50

        # Add macro information with shadow
        macro_text = (
            f"{recipe.macros.calories} cal | "
            f"P:{recipe.macros.protein_g:.1f}g ({recipe.macros.protein_percentage:.0f}%) | "
            f"C:{recipe.macros.carbs_g:.1f}g ({recipe.macros.carbs_percentage:.0f}%) | "
            f"F:{recipe.macros.fat_g:.1f}g ({recipe.macros.fat_percentage:.0f}%)"
        )
        # Draw shadow
        draw.text((42, target_height-58), macro_text, font=macro_font, fill='black')
        # Draw text
        draw.text((40, target_height-60), macro_text, font=macro_font, fill='white')
        
        # Merge image and overlay
        final_img = PILImage.alpha_composite(img.convert('RGBA'), overlay)
        final_img = final_img.convert('RGB')  # Convert back to RGB for JPEG support
        
        # Save with higher quality
        thumbnail_path = f"recipe_thumbnail_{int(time.time())}.jpg"
        final_img.save(thumbnail_path, "JPEG", quality=95)
        
        print("✅ Thumbnail created successfully")
        return thumbnail_path

    except Exception as e:
        print(f"⚠️ Thumbnail generation error: {str(e)}")
        return None

def display_recipe(recipe: Recipe):
    """Display recipe information in console"""
    print("\n" + "="*50)
    print(f"📝 {recipe.title.upper()}")
    print("="*50)
    
    print("\n📋 DESCRIPTION")
    print(recipe.description)
    
    print("\n📊 RECIPE INFO")
    print(f"Cuisine: {recipe.cuisine_type}")
    print(f"Difficulty: {recipe.difficulty}")
    print(f"Prep Time: {recipe.prep_time} minutes")
    print(f"Cook Time: {recipe.cook_time} minutes")
    print(f"Total Time: {recipe.total_time} minutes")
    print(f"Servings: {recipe.servings}")
    
    print("\n🍎 NUTRITION (per serving)")
    print(f"Calories: {recipe.macros.calories}")
    print(f"Protein: {recipe.macros.protein_g:.1f}g ({recipe.macros.protein_percentage:.0f}%)")
    print(f"Carbs: {recipe.macros.carbs_g:.1f}g ({recipe.macros.carbs_percentage:.0f}%)")
    print(f"Fat: {recipe.macros.fat_g:.1f}g ({recipe.macros.fat_percentage:.0f}%)")
    if recipe.macros.fiber_g > 0:
        print(f"Fiber: {recipe.macros.fiber_g:.1f}g")
    if recipe.macros.sugar_g > 0:
        print(f"Sugar: {recipe.macros.sugar_g:.1f}g")
    
    print("\n🥕 INGREDIENTS")
    for ing in recipe.ingredients:
        notes = f" ({ing.notes})" if ing.notes else ""
        print(f"• {ing.amount} {ing.unit} {ing.name}{notes}")
    
    print("\n🔧 EQUIPMENT NEEDED")
    for item in recipe.equipment_needed:
        print(f"• {item}")
    
    print("\n📝 INSTRUCTIONS")
    for step in recipe.steps:
        duration = f" ({step.duration_minutes} min)" if step.duration_minutes else ""
        temp = f" at {step.temperature}" if step.temperature else ""
        print(f"{step.order}. {step.instruction}{duration}{temp}")
        if step.tips:
            print(f"   Tip: {step.tips}")
        if step.equipment_needed:
            print(f"   Equipment: {', '.join(step.equipment_needed)}")
    
    if recipe.tips_and_tricks:
        print("\n💡 TIPS & TRICKS")
        for tip in recipe.tips_and_tricks:
            print(f"• {tip}")
    
    print("\n🔄 STORAGE & REHEATING")
    print(f"Storage: {recipe.storage_instructions}")
    print(f"Reheating: {recipe.reheating_instructions}")
    
    if recipe.shopping_list:
        print("\n🛒 SHOPPING LIST")
        sections = {}
        for item in recipe.shopping_list:
            if item.store_section not in sections:
                sections[item.store_section] = []
            sections[item.store_section].append(item)
        
        for section, items in sorted(sections.items()):
            print(f"\n{section}:")
            for item in items:
                print(f"• {item.amount} {item.unit} {item.name}")
    
    print("\n" + "="*50 + "\n")

def export_recipe_pdf(recipe: Recipe, thumbnail_path: str = None):
    """Export recipe to PDF with Unicode support"""
    try:
        print("📄 Generating PDF...")
        pdf = FPDF()
        
        # Enable UTF-8 encoding
        pdf.set_auto_page_break(auto=True, margin=15)
        
        def safe_text(text):
            """Convert problematic characters to safe alternatives"""
            return (text.replace('•', '-')
                      .replace('…', '...')
                      .replace('"', '"')
                      .replace('"', '"')
                      .replace(''', "'")
                      .replace(''', "'")
                      .encode('latin-1', 'replace').decode('latin-1'))
        
        pdf.add_page()
        
        # Add thumbnail if available
        if thumbnail_path and os.path.exists(thumbnail_path):
            try:
                pdf.image(thumbnail_path, x=10, y=10, w=190)
                pdf.ln(60)
            except:
                print("⚠️ Could not add thumbnail to PDF")
                pdf.ln(10)
        
        # Title
        pdf.set_font('Arial', 'B', 24)
        pdf.cell(0, 10, safe_text(recipe.title), ln=True, align='C')
        pdf.ln(5)
        
        # Description
        pdf.set_font('Arial', '', 12)
        pdf.multi_cell(0, 10, safe_text(recipe.description))
        pdf.ln(5)
        
        # Recipe Info
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, 'Recipe Information', ln=True)
        pdf.set_font('Arial', '', 12)
        pdf.cell(0, 10, f'Cuisine: {safe_text(recipe.cuisine_type)}', ln=True)
        pdf.cell(0, 10, f'Difficulty: {safe_text(recipe.difficulty)}', ln=True)
        pdf.cell(0, 10, f'Prep Time: {recipe.prep_time} minutes', ln=True)
        pdf.cell(0, 10, f'Cook Time: {recipe.cook_time} minutes', ln=True)
        pdf.cell(0, 10, f'Total Time: {recipe.total_time} minutes', ln=True)
        pdf.cell(0, 10, f'Servings: {recipe.servings}', ln=True)
        pdf.ln(5)
        
        # Nutrition Information
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, 'Nutrition (per serving)', ln=True)
        pdf.set_font('Arial', '', 12)
        pdf.cell(0, 10, f'Calories: {recipe.macros.calories}', ln=True)
        pdf.cell(0, 10, f'Protein: {recipe.macros.protein_g:.1f}g ({recipe.macros.protein_percentage:.0f}%)', ln=True)
        pdf.cell(0, 10, f'Carbs: {recipe.macros.carbs_g:.1f}g ({recipe.macros.carbs_percentage:.0f}%)', ln=True)
        pdf.cell(0, 10, f'Fat: {recipe.macros.fat_g:.1f}g ({recipe.macros.fat_percentage:.0f}%)', ln=True)
        if recipe.macros.fiber_g > 0:
            pdf.cell(0, 10, f'Fiber: {recipe.macros.fiber_g:.1f}g', ln=True)
        if recipe.macros.sugar_g > 0:
            pdf.cell(0, 10, f'Sugar: {recipe.macros.sugar_g:.1f}g', ln=True)
        pdf.ln(5)
        
        # Ingredients
        pdf.add_page()
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, 'Ingredients', ln=True)
        pdf.set_font('Arial', '', 12)
        for ing in recipe.ingredients:
            notes = f" ({safe_text(ing.notes)})" if ing.notes else ""
            pdf.multi_cell(0, 10, f"- {ing.amount} {safe_text(ing.unit)} {safe_text(ing.name)}{notes}")
        pdf.ln(5)
        
        # Equipment
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, 'Equipment Needed', ln=True)
        pdf.set_font('Arial', '', 12)
        for item in recipe.equipment_needed:
            pdf.cell(0, 10, f"- {safe_text(item)}", ln=True)
        pdf.ln(5)
        
        # Instructions
        pdf.add_page()
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, 'Instructions', ln=True)
        pdf.set_font('Arial', '', 12)
        for step in recipe.steps:
            duration = f" ({step.duration_minutes} min)" if step.duration_minutes else ""
            temp = f" at {step.temperature}" if step.temperature else ""
            pdf.multi_cell(0, 10, f"{step.order}. {safe_text(step.instruction)}{duration}{temp}")
            if step.tips:
                pdf.set_font('Arial', 'I', 10)
                pdf.multi_cell(0, 10, f"Tip: {safe_text(step.tips)}")
                pdf.set_font('Arial', '', 12)
            if step.equipment_needed:
                pdf.set_font('Arial', 'I', 10)
                pdf.multi_cell(0, 10, f"Equipment: {', '.join(safe_text(eq) for eq in step.equipment_needed)}")
                pdf.set_font('Arial', '', 12)
            pdf.ln(2)
        
        # Tips & Tricks
        if recipe.tips_and_tricks:
            pdf.add_page()
            pdf.set_font('Arial', 'B', 14)
            pdf.cell(0, 10, 'Tips & Tricks', ln=True)
            pdf.set_font('Arial', '', 12)
            for tip in recipe.tips_and_tricks:
                pdf.multi_cell(0, 10, f"- {safe_text(tip)}")
            pdf.ln(5)
        
        # Storage & Reheating
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, 'Storage & Reheating', ln=True)
        pdf.set_font('Arial', '', 12)
        pdf.multi_cell(0, 10, f"Storage: {safe_text(recipe.storage_instructions)}")
        pdf.multi_cell(0, 10, f"Reheating: {safe_text(recipe.reheating_instructions)}")
        pdf.ln(5)
        
        # Shopping List
        if recipe.shopping_list:
            pdf.add_page()
            pdf.set_font('Arial', 'B', 14)
            pdf.cell(0, 10, 'Shopping List', ln=True)
            
            sections = {}
            for item in recipe.shopping_list:
                if item.store_section not in sections:
                    sections[item.store_section] = []
                sections[item.store_section].append(item)
            
            for section, items in sections.items():
                pdf.set_font('Arial', 'B', 12)
                pdf.cell(0, 10, safe_text(section), ln=True)
                pdf.set_font('Arial', '', 12)
                for item in items:
                    pdf.cell(0, 10, f"- {item.amount} {safe_text(item.unit)} {safe_text(item.name)}", ln=True)
                pdf.ln(2)
        
        # Save PDF
        filename = f"recipe_{safe_text(recipe.title.lower().replace(' ', '_'))}_{int(time.time())}.pdf"
        pdf.output(filename)
        return filename
        
    except Exception as e:
        print(f"⚠️ PDF export error: {str(e)}")
        return None

def process_instagram_recipe():
    """Main recipe processing function"""
    print("✅ Recipe processor ready!")
    print("\nPaste an Instagram recipe URL (or 'q' to quit):")
    
    while True:
        try:
            url = input().strip()
            
            if url.lower() == 'q':
                break
                
            if url:
                clear_output()
                print(f"Processing: {url}")
                
                # Extract video content and transcription
                video_data = download_and_transcribe_video(url)
                
                # Get post content
                content = extract_instagram_content(url)
                if not content:
                    print("❌ Could not access Instagram content")
                    continue
                
                # Add transcription to content
                content['transcription'] = video_data.get('transcription') if video_data else None
                
                # Parse recipe using GPT-4o structured output
                recipe = parse_recipe_content(content)
                if recipe:
                    # Generate shopping list
                    shopping_list = generate_shopping_list(recipe)
                    recipe.shopping_list = shopping_list
                    
                    # Generate thumbnail
                    if content['image_url']:
                        thumbnail_path = generate_thumbnail(recipe, content['image_url'])
                        recipe.thumbnail_url = thumbnail_path
                    
                    # Display recipe in console
                    display_recipe(recipe)
                    
                    # Ask if user wants PDF
                    pdf_response = input("\nWould you like to download the recipe as PDF? (y/n): ").strip().lower()
                    if pdf_response == 'y':
                        # Export PDF
                        pdf_filename = export_recipe_pdf(recipe, recipe.thumbnail_url)
                        if pdf_filename:
                            files.download(pdf_filename)
                            print(f"✅ PDF exported successfully as '{pdf_filename}'")
                    
                    print("\n✅ Recipe processed successfully!")
                    print("\nOptions:")
                    print("1. Process another URL (paste URL)")
                    print("2. Quit (type 'q')")
                else:
                    print("❌ Could not create recipe")
                
                print("\nPaste another URL or 'q' to quit:")
        
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            print("\nPaste another URL or 'q' to quit:")

    # Cleanup
    try:
        driver.quit()
    except:
        pass

# Run the recipe extractor
if __name__ == "__main__":
    try:
        process_instagram_recipe()
    finally:
        driver.quit()