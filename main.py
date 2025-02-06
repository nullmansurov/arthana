import sys
from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import json
import shutil
import re


# Инициализация приложения Flask
app = Flask(__name__)

# Пути к директориям
BASE_DIR = os.path.join(os.path.expanduser('~'), 'Desktop', 'workspace')
TEMPLATE_DIR = os.path.join(BASE_DIR, 'templates')
PROJECTS_DIR = os.path.join(BASE_DIR, 'projects')

# Конфигурация путей
app.template_folder = TEMPLATE_DIR

# Создание необходимых директорий
os.makedirs(PROJECTS_DIR, exist_ok=True)
os.makedirs(TEMPLATE_DIR, exist_ok=True)

# Функции для работы с избранным
def load_favorites():
    fav_path = os.path.join(PROJECTS_DIR, '.favorites.json')
    if os.path.exists(fav_path):
        with open(fav_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_favorites(favorites):
    fav_path = os.path.join(PROJECTS_DIR, '.favorites.json')
    with open(fav_path, 'w', encoding='utf-8') as f:
        json.dump(favorites, f, ensure_ascii=False)

# API Endpoints
@app.route('/rename_project', methods=['POST'])
def rename_project():
    old_name = request.form.get('old_name')
    new_name = request.form.get('new_name')

    # Проверка наличия обязательных параметров
    if not old_name or not new_name:
        return jsonify({
            'success': False,
            'error': 'Оба имени обязательны'
        }), 400

    # Валидация нового имени
    if not re.match(r'^[a-zA-Zа-яА-ЯёЁ0-9_ \-]+$', new_name):
        return jsonify({
            'success': False,
            'error': 'Недопустимые символы. Разрешены: буквы, цифры, пробелы, - и _'
        }), 400

    old_path = os.path.join(PROJECTS_DIR, old_name)
    new_path = os.path.join(PROJECTS_DIR, new_name)

    # Проверка существования исходного проекта
    if not os.path.exists(old_path):
        return jsonify({
            'success': False,
            'error': 'Исходный проект не найден'
        }), 404

    # Проверка на дубликат
    if os.path.exists(new_path):
        return jsonify({
            'success': False,
            'error': 'Проект с таким именем уже существует'
        }), 409

    try:
        # Основная операция переименования
        os.rename(old_path, new_path)

        # Обновление избранного
        favorites = load_favorites()
        updated_favorites = [new_name if name == old_name else name for name in favorites]
        save_favorites(updated_favorites)

        return jsonify({
            'success': True,
            'new_name': new_name
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка сервера: {str(e)}'
        }), 500


@app.route('/favorite_project', methods=['POST'])
def favorite_project():
    project_name = request.form.get('project_name')
    action = request.form.get('action')
    
    if not project_name or action not in ['add', 'remove']:
        return jsonify({'success': False, 'error': 'Invalid parameters'})

    favorites = load_favorites()
    
    if action == 'add':
        if project_name not in favorites:
            favorites.append(project_name)
    elif action == 'remove':
        if project_name in favorites:
            favorites.remove(project_name)

    save_favorites(favorites)
    return jsonify({'success': True, 'favorites': favorites})

@app.route('/load_favorites', methods=['GET'])
def load_favorites_route():
    return jsonify({'success': True, 'favorites': load_favorites()})

@app.route('/delete_project', methods=['POST'])
def delete_project():
    project_name = request.form.get('project_name')
    if not project_name:
        return jsonify({'success': False, 'error': 'Project name required'})
    
    project_path = os.path.join(PROJECTS_DIR, project_name)
    
    if not os.path.exists(project_path):
        return jsonify({'success': False, 'error': 'Project not found'})
    
    try:
        shutil.rmtree(project_path)
        # Обновляем избранное
        favorites = load_favorites()
        if project_name in favorites:
            favorites.remove(project_name)
            save_favorites(favorites)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/create_project', methods=['POST'])
def create_project():
    project_name = request.form.get('project_name')
    if not project_name:
        return jsonify({'success': False, 'error': 'Project name required'})
    
    project_path = os.path.join(PROJECTS_DIR, project_name)
    
    if os.path.exists(project_path):
        return jsonify({'success': False, 'error': 'Project already exists'})
    
    try:
        os.makedirs(project_path)
        index_file = os.path.join(project_path, 'index.html')
        
        with open(index_file, 'w', encoding='utf-8') as f:
            f.write(f"""<!DOCTYPE html>
<html>
<head>
  <meta charset='UTF-8'>
  <title>{project_name}</title>
</head>
<body>
  <!-- Project content -->
</body>
</html>""")
            
        return jsonify({'success': True, 'project': project_name})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/load_project', methods=['GET'])
def load_project():
    project_name = request.args.get('project_name')
    if not project_name:
        return jsonify({'success': False, 'error': 'Project name required'})
    
    project_file = os.path.join(PROJECTS_DIR, project_name, 'index.html')
    
    if not os.path.exists(project_file):
        return jsonify({'success': False, 'error': 'Project not found'})
    
    try:
        with open(project_file, 'r', encoding='utf-8') as f:
            content = f.read()
        return jsonify({'success': True, 'content': content})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/save_project', methods=['POST'])
def save_project():
    project_name = request.form.get('project_name')
    content = request.form.get('content')
    
    if not project_name:
        return jsonify({'success': False, 'error': 'Project name required'})
    
    project_file = os.path.join(PROJECTS_DIR, project_name, 'index.html')
    
    try:
        with open(project_file, 'w', encoding='utf-8') as f:
            f.write(content)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/upload_file', methods=['POST'])
def upload_file():
    project_name = request.form.get('project_name')
    if not project_name:
        return jsonify({'success': False, 'error': 'Project name required'})
    
    file = request.files.get('file')
    if not file:
        return jsonify({'success': False, 'error': 'No file uploaded'})
    
    project_path = os.path.join(PROJECTS_DIR, project_name)
    
    if not os.path.exists(project_path):
        return jsonify({'success': False, 'error': 'Project not found'})
    
    try:
        filename = file.filename
        file.save(os.path.join(project_path, filename))
        return jsonify({'success': True, 'filename': filename})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/workspace/<project>/<filename>')
def serve_workspace_file(project, filename):
    return send_from_directory(os.path.join(PROJECTS_DIR, project), filename)

@app.route('/')
def index():
    try:
        projects = [p for p in os.listdir(PROJECTS_DIR) 
                   if os.path.isdir(os.path.join(PROJECTS_DIR, p))]
    except FileNotFoundError:
        projects = []
        
    return render_template('index.html', 
                         projects=projects,
                         favorites=load_favorites())

@app.route('/styles.css')
def styles():
    return send_from_directory(app.template_folder, 'styles.css')

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory(os.path.join(app.template_folder, 'js'), filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)