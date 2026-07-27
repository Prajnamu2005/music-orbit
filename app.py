from flask import Flask, jsonify, request, send_from_directory
import requests
import random

app = Flask(__name__, static_folder='.', static_url_path='')

ITUNES_API = 'https://itunes.apple.com'

POPULAR_SEARCHES = [
    'daft punk', 'the weeknd', 'dua lipa', 'drake', 'billie eilish',
    'bad bunny', 'taylor swift', 'ed sheeran', 'ariana grande', 'post malone',
    'doja cat', 'sza', 'travis scott', 'kendrick lamar', 'beyonce',
    'eminem', 'coldplay', 'imagine dragons', 'arctic monkeys', 'the kid laroi',
    'olivia rodrigo', 'harry styles', 'lizzo', 'megan thee stallion', 'jack harlow',
    'avicii', 'marshmello', 'calvin harris', 'kygo', 'the chainsmokers',
    'blinding lights', 'shape of you', 'bad guy', 'watermelon sugar',
    'levitating', 'stay', 'peaches', 'heat waves', 'as it was', 'anti-hero',
]


def normalize_track(item):
    artwork = item.get('artworkUrl100', '')
    artwork_big = artwork.replace('100x100', '600x600') if artwork else ''
    return {
        'id': item.get('trackId') or item.get('collectionId'),
        'title': item.get('trackName', ''),
        'artist': {'name': item.get('artistName', '')},
        'album': {
            'title': item.get('collectionName', ''),
            'cover_big': artwork_big,
            'cover_medium': artwork.replace('100x100', '300x300') if artwork else '',
            'cover_small': artwork,
        },
        'preview': item.get('previewUrl', ''),
        'duration': item.get('trackTimeMillis', 0) // 1000,
        'link': item.get('trackViewUrl', ''),
    }


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/api/charts')
def charts():
    limit = request.args.get('limit', 10, type=int)
    selected = random.sample(POPULAR_SEARCHES, min(limit, len(POPULAR_SEARCHES)))
    seen_ids = set()
    results = []
    for q in selected:
        if len(results) >= limit:
            break
        try:
            r = requests.get(f'{ITUNES_API}/search', params={
                'term': q, 'media': 'music', 'entity': 'song', 'limit': 1
            }, timeout=5)
            r.raise_for_status()
            items = r.json().get('results', [])
            for item in items:
                track = normalize_track(item)
                if track['id'] not in seen_ids and track['preview']:
                    seen_ids.add(track['id'])
                    results.append(track)
                    if len(results) >= limit:
                        break
        except requests.RequestException:
            continue
    return jsonify({'data': results, 'total': len(results)})


@app.route('/api/search')
def search():
    query = request.args.get('q', '', type=str)
    limit = request.args.get('limit', 10, type=int)
    if not query:
        return jsonify({'error': 'Query parameter q is required'}), 400
    try:
        r = requests.get(f'{ITUNES_API}/search', params={
            'term': query, 'media': 'music', 'entity': 'song', 'limit': limit
        }, timeout=10)
        r.raise_for_status()
        items = r.json().get('results', [])
        results = [normalize_track(item) for item in items if item.get('previewUrl')]
        return jsonify({'data': results, 'total': len(results)})
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 502


@app.route('/api/genres')
def genres():
    genre = request.args.get('genre', '', type=str)
    limit = request.args.get('limit', 10, type=int)
    if not genre:
        return jsonify({'error': 'genre parameter is required'}), 400
    try:
        r = requests.get(f'{ITUNES_API}/search', params={
            'term': genre + ' music', 'media': 'music', 'entity': 'song', 'limit': limit
        }, timeout=10)
        r.raise_for_status()
        items = r.json().get('results', [])
        results = [normalize_track(item) for item in items if item.get('previewUrl')]
        return jsonify({'data': results, 'total': len(results)})
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 502


if __name__ == '__main__':
    app.run(debug=True, port=5000)
