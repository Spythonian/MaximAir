import { NextRequest, NextResponse } from 'next/server';
import { getAllEpisodes, addEpisode, updateEpisode, deleteEpisode } from '@/lib/episodes';

export async function GET() {
  try {
    const episodes = getAllEpisodes();
    return NextResponse.json(episodes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch episodes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, duration, category, status } = body;

    if (!title || !description || !duration || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newEpisode = addEpisode({
      title,
      description,
      duration,
      category,
      status: status || 'draft',
      date: new Date().toISOString().split('T')[0]
    });

    return NextResponse.json(newEpisode, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create episode' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Episode ID is required' }, { status: 400 });
    }

    const updatedEpisode = updateEpisode(id, updates);
    
    if (!updatedEpisode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    return NextResponse.json(updatedEpisode);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update episode' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Episode ID is required' }, { status: 400 });
    }

    const success = deleteEpisode(parseInt(id));
    
    if (!success) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Episode deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete episode' }, { status: 500 });
  }
}