# For the given list of billboard top songs, finds corresponding songs off
# Spotify and grabs as much relevant data as possible.
#
# Usage:
#
#   $ cat billboard.csv | python bin/analyze.py > output.csv
#

import sys
import csv
import spotipy
import argparse
import json
from spotipy.oauth2 import SpotifyClientCredentials

def find_track_by_hit(hit, client):
    """
    Finds a corresponding Spotify Track given a Billboard Hit. Reference:

      * http://spotipy.readthedocs.io/en/latest/#spotipy.client.Spotify.search
      * https://developer.spotify.com/web-api/console/get-search-item/

    """
    q = hit['Artist'] + ' ' + hit['Song']

    response = client.search(q,
        limit = 1,
        offset = 0,
        type = 'track'
    )

    if response['tracks']['total'] == 0:
        raise ValueError('Failed to find corresponding track for "%s"' % q)

    return response['tracks']['items'][0]

def get_track_audio_features(track, client):
    """
    Gets the audio features of a track. Reference:

      * http://spotipy.readthedocs.io/en/latest/#spotipy.client.Spotify.audio_features
      * https://developer.spotify.com/web-api/console/get-audio-features-track/

    """
    return client.audio_features(tracks = [track['id']])[0]

def get_album_by_track(track, client):
    """
    Gets the album where this track belongs to. Reference:

      * http://spotipy.readthedocs.io/en/latest/#spotipy.client.Spotify.album
      * https://developer.spotify.com/web-api/console/get-album/#complete

    """
    return client.album(track['album']['id'])

def get_track_audio_analysis(track, client):
    """
    Gets the analysis of a track. Reference:

      * https://developer.spotify.com/web-api/console/get-audio-analysis-track/.
      * http://spotipy.readthedocs.io/en/latest/#spotipy.client.Spotify.audio_analysis

    """
    return client.audio_analysis(track['id'])

def parse_args():
    parser = argparse.ArgumentParser(description = 'Fetch the data from Spotify', add_help = True)
    parser.add_argument('--no-header', help = 'Don\' output the header', action = 'store_true')

    return parser.parse_args()

# Could also use environment variables for client id and secret, but I feel this
# would be a bit more cumbersome right now.
#
#     export SPOTIPY_CLIENT_ID='*client_id*'
#     export SPOTIPY_CLIENT_SECRET='*client_secret*
#
client = spotipy.Spotify(client_credentials_manager = SpotifyClientCredentials(
    client_id = 'b1f28da8553c44beb65edac3ed1abac7',
    client_secret = 'a380918b1c4b4422ba14dbe270eef8f5'
))

writer = csv.writer(sys.stdout)
header = not parse_args().no_header

for hit in csv.DictReader(sys.stdin):

    try:
        track = find_track_by_hit(hit, client)
        album = get_album_by_track(track, client)
        features = get_track_audio_features(track, client)
        #analysis = get_track_audio_analysis(track, client)

        row = {
            'name': track['name'].encode('ascii'),
            'artist': hit['Artist'],
            'year': hit['Year'],
            'rank': hit['Rank'],
            'lyrics': hit['Lyrics'],
            'genres': json.dumps(album['genres']),
            # A detailed description of what each field means is given at
            # https://developer.spotify.com/web-api/object-model/#track-object-full.
            'duration_ms': track['duration_ms'],
            'explicit': '1' if track['explicit'] else '0',
            'href': track['external_urls']['spotify'],
            'popularity': track['popularity'],
            # A detailed description of what each field means is given at
            # https://developer.spotify.com/web-api/object-model/#audio-features-object.
            'acousticness': features['acousticness'],
            'danceability': features['danceability'],
            'energy': features['energy'],
            'instrumentalness': features['instrumentalness'],
            'key': features['key'],
            'liveness': features['liveness'],
            'loudness': features['loudness'],
            'mode': features['mode'],
            'speechiness': features['speechiness'],
            'tempo': features['tempo'],
            'time_signature': features['time_signature'],
            'valence': features['valence'],
            # Hard-core analysis - please refer to doc/audio-analysis.pdf what
            # each field specifically means. Note that all of these attributes
            # contain multiple items.
            #'bars': json.dumps(analysis['bars']),
            #'beats': json.dumps(analysis['beats']),
            #'sections': json.dumps(analysis['sections']),
            #'segments': json.dumps(analysis['segments']),
            #'tatums': json.dumps(analysis['tatums']),
        }
    except ValueError:
        row = {
            'name': None,
            'artist': hit['Artist'],
            'year': hit['Year'],
            'rank': hit['Rank'],
            'lyrics': hit['Lyrics'],
            'genres': None,
            # A detailed description of what each field means is given at
            # https://developer.spotify.com/web-api/object-model/#track-object-full.
            'duration_ms': None,
            'explicit': None,
            'href': None,
            'popularity': None,
            # A detailed description of what each field means is given at
            # https://developer.spotify.com/web-api/object-model/#audio-features-object.
            'acousticness': None,
            'danceability': None,
            'energy': None,
            'instrumentalness': None,
            'key': None,
            'liveness': None,
            'loudness': None,
            'mode': None,
            'speechiness': None,
            'tempo': None,
            'time_signature': None,
            'valence': None,
            # Hard-core analysis - please refer to doc/audio-analysis.pdf what
            # each field specifically means. Note that all of these attributes
            # contain multiple items.
            #'bars': None,
            #'beats': None,
            #'sections': None,
            #'segments': None,
            #'tatums': None,
        }

    if header:
        writer.writerow(row.keys())
        header = not header

    writer.writerow(row.values())
