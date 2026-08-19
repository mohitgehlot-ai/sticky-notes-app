from flask import Flask, render_template, request, jsonify
import csv
import os
import uuid
from datetime import datetime

app = Flask(__name__)
DATA_FILE = 'data.csv'

def init_csv():
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'content', 'color', 'pinned', 'timestamp'])

def get_all_notes():
    notes = []
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            row['pinned'] = row['pinned'] == 'True'
            notes.append(row)
    return notes

def save_all_notes(notes):
    with open(DATA_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['id', 'content', 'color', 'pinned', 'timestamp'])
        writer.writeheader()
        writer.writerows(notes)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes', methods=['GET'])
def get_notes():
    return jsonify(get_all_notes())

@app.route('/api/notes', methods=['POST'])
def add_note():
    data = request.json
    new_note = {
        'id': str(uuid.uuid4())[:8],
        'content': data['content'],
        'color': data.get('color', 'blue'),
        'pinned': False,
        'timestamp': datetime.now().strftime("%b %d, %H:%M")
    }
    notes = get_all_notes()
    notes.insert(0, new_note)
    save_all_notes(notes)
    return jsonify(new_note)

@app.route('/api/notes/<note_id>', methods=['PUT', 'DELETE'])
def update_note(note_id):
    notes = get_all_notes()
    if request.method == 'DELETE':
        notes = [n for n in notes if n['id'] != note_id]
        save_all_notes(notes)
        return '', 204
    
    if request.method == 'PUT':
        updates = request.json
        for n in notes:
            if n['id'] == note_id:
                n.update(updates)
        save_all_notes(notes)
        return jsonify({'status': 'success'})

if __name__ == '__main__':
    init_csv()
    app.run(debug=True)