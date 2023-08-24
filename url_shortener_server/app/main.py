from flask import Flask, redirect, render_template
import firebase_admin
from firebase_admin import db
import os

cred_obj = firebase_admin.credentials.Certificate('./ServiceAccountKey.json')
default_app = firebase_admin.initialize_app(cred_obj, {
    'databaseURL': 'https://url-shortener-vid-default-rtdb.europe-west1.firebasedatabase.app'
})

app = Flask(__name__, static_folder='./build/static', template_folder='./build')

@app.route('/')
def hello_world():
    return redirect('/app')

@app.route('/app')
def homepage():
    return render_template('index.html')

@app.route('/<path:generatedKey>', methods=['GET'])
def fetch_from_firebase(generatedKey):
    ref = db.reference('/' + generatedKey)
    data = ref.get()
    if not data:
        return '404 nenájdené'
    else:
        longURL = data['longURL']
        return redirect(longURL)