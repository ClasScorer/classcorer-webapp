import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { synchronizeCanvasData, saveCanvasConfig, setCanvasConfigActive } from '@/lib/canvas';

// Make this route dynamic to always run on the server
export const dynamic = 'force-dynamic';

// GET endpoint to retrieve Canvas config
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user from the session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        canvasConfig: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(user.canvasConfig || { isActive: false });
  } catch (error) {
    console.error('Error getting Canvas config:', error);
    return NextResponse.json(
      { error: 'Failed to get Canvas config' },
      { status: 500 }
    );
  }
}

// POST endpoint to save Canvas config
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user from the session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get config data from request
    const { apiUrl, apiToken } = await request.json();
    
    if (!apiUrl || !apiToken) {
      return NextResponse.json(
        { error: 'API URL and token are required' },
        { status: 400 }
      );
    }
    
    // Save config
    const config = await saveCanvasConfig(user.id, apiUrl, apiToken);
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error saving Canvas config:', error);
    return NextResponse.json(
      { error: 'Failed to save Canvas config' },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update active state or sync data
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user from the session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get action and data from request
    const { action, isActive } = await request.json();
    
    if (action === 'setActive' && typeof isActive === 'boolean') {
      // Update active state
      const config = await setCanvasConfigActive(user.id, isActive);
      return NextResponse.json(config);
    } else if (action === 'sync') {
      // Sync data
      await synchronizeCanvasData(user.id);
      
      // Get updated config
      const config = await prisma.canvasConfig.findUnique({
        where: { userId: user.id }
      });
      
      return NextResponse.json(config);
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating Canvas config:', error);
    return NextResponse.json(
      { error: 'Failed to update Canvas config' },
      { status: 500 }
    );
  }
} 