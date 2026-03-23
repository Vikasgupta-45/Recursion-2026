import re

async def segment_transcript(transcript_dict: dict, min_duration=15, max_duration=60) -> list:
    """
    Groups whisper segments into candidate clips.
    Uses basic heuristics to combine short segments into chunks between min_duration and max_duration.
    """
    segments = transcript_dict.get('segments', [])
    if not segments:
        return []
        
    candidate_clips = []
    current_clip = {
        'start': segments[0].get('start', 0),
        'end': 0,
        'text': "",
        'segments': []
    }
    
    for seg in segments:
        text = seg.get('text', '').strip()
        start = seg.get('start', 0)
        end = seg.get('end', 0)
        
        # If adding this segment exceeds max duration, finalize the clip
        clip_duration = end - current_clip['start']
        
        # Determine if there's a good boundary (sentence end)
        is_boundary = bool(re.search(r'[.!?]$', text))
        
        if clip_duration > max_duration or (clip_duration >= min_duration and is_boundary):
            current_clip['end'] = end
            current_clip['text'] += f" {text}"
            candidate_clips.append(current_clip)
            
            # Start a new clip
            current_clip = {
                'start': end,
                'end': end,
                'text': "",
                'segments': []
            }
        else:
            if not current_clip['text']:
                current_clip['start'] = start
            current_clip['text'] += f" {text}"
            current_clip['end'] = end
            current_clip['segments'].append(seg)
            
    # Add the last clip if it has content and reasonable duration
    last_clip_duration = current_clip['end'] - current_clip['start']
    if current_clip['text'].strip() and last_clip_duration > 5:
        candidate_clips.append(current_clip)
        
    return candidate_clips
