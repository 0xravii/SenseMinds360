import { NextRequest, NextResponse } from 'next/server';
import { getMemoryUsage, getNetworkInfo } from '@/lib/performance';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: 'operational' | 'degraded' | 'offline';
    redis: 'operational' | 'degraded' | 'offline';
    external_apis: 'operational' | 'degraded' | 'offline';
  };
  performance: {
    memory?: any;
    network?: any;
    responseTime: number;
  };
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    duration: number;
  }[];
}

// Individual health check functions
async function checkDatabase(): Promise<{ status: 'pass' | 'fail' | 'warn'; message?: string; duration: number }> {
  const start = Date.now();
  
  try {
    // Simulate database check - replace with actual database ping
    // For Supabase:
    // const { data, error } = await supabase.from('health_check').select('1').limit(1);
    // if (error) throw error;
    
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate check
    
    return {
      status: 'pass',
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Database connection failed',
      duration: Date.now() - start,
    };
  }
}

async function checkRedis(): Promise<{ status: 'pass' | 'fail' | 'warn'; message?: string; duration: number }> {
  const start = Date.now();
  
  try {
    // Simulate Redis check - replace with actual Redis ping
    // const redis = new Redis(process.env.REDIS_URL);
    // await redis.ping();
    
    await new Promise(resolve => setTimeout(resolve, 5)); // Simulate check
    
    return {
      status: 'pass',
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'warn', // Redis is optional, so warn instead of fail
      message: error instanceof Error ? error.message : 'Redis connection failed',
      duration: Date.now() - start,
    };
  }
}

async function checkExternalAPIs(): Promise<{ status: 'pass' | 'fail' | 'warn'; message?: string; duration: number }> {
  const start = Date.now();
  
  try {
    // Check critical external APIs
  const apiChecks = await Promise.allSettled([
    // Add your external API checks here
    // fetch('https://api.example.com/health', { timeout: 5000 }),
    Promise.resolve('no-external-apis') // Placeholder to avoid empty array
  ]);
  
  const failedChecks = apiChecks.filter(check => check.status === 'rejected');
    
    if (failedChecks.length === 0) {
      return {
        status: 'pass',
        duration: Date.now() - start,
      };
    } else if (failedChecks.length < apiChecks.length) {
      return {
        status: 'warn',
        message: `${failedChecks.length}/${apiChecks.length} external APIs failed`,
        duration: Date.now() - start,
      };
    } else {
      return {
        status: 'fail',
        message: 'All external APIs failed',
        duration: Date.now() - start,
      };
    }
  } catch (error) {
    return {
      status: 'warn',
      message: error instanceof Error ? error.message : 'External API check failed',
      duration: Date.now() - start,
    };
  }
}

async function checkDiskSpace(): Promise<{ status: 'pass' | 'fail' | 'warn'; message?: string; duration: number }> {
  const start = Date.now();
  
  try {
    // In a real implementation, you'd check actual disk space
    // For now, simulate a check
    const freeSpacePercent = 75; // Simulate 75% free space
    
    if (freeSpacePercent > 20) {
      return {
        status: 'pass',
        duration: Date.now() - start,
      };
    } else if (freeSpacePercent > 10) {
      return {
        status: 'warn',
        message: `Low disk space: ${freeSpacePercent}% free`,
        duration: Date.now() - start,
      };
    } else {
      return {
        status: 'fail',
        message: `Critical disk space: ${freeSpacePercent}% free`,
        duration: Date.now() - start,
      };
    }
  } catch (error) {
    return {
      status: 'warn',
      message: 'Could not check disk space',
      duration: Date.now() - start,
    };
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Run all health checks in parallel
    const settledChecks = await Promise.allSettled([
      checkDatabase(),
      checkRedis(),
      checkExternalAPIs(),
      checkDiskSpace(),
    ]);
    
    const failedChecks = settledChecks.filter(check => check.status === 'rejected') as PromiseRejectedResult[];
    
    // Extract results from settled promises
    const [dbCheck, redisCheck, apiCheck, diskCheck] = settledChecks.map(check => 
      check.status === 'fulfilled' ? check.value : { status: 'fail' as const, message: 'Check failed', duration: 0 }
    );

    const checks = [
      { name: 'database', ...dbCheck },
      { name: 'redis', ...redisCheck },
      { name: 'external_apis', ...apiCheck },
      { name: 'disk_space', ...diskCheck },
    ];

    // Determine overall status
    const hasFailures = checks.some(check => check.status === 'fail');
    const hasWarnings = checks.some(check => check.status === 'warn');
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (hasFailures) {
      overallStatus = 'unhealthy';
    } else if (hasWarnings) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    // Determine service statuses
    const services = {
      database: dbCheck.status === 'pass' ? 'operational' as const : 
                dbCheck.status === 'warn' ? 'degraded' as const : 'offline' as const,
      redis: redisCheck.status === 'pass' ? 'operational' as const : 
             redisCheck.status === 'warn' ? 'degraded' as const : 'offline' as const,
      external_apis: apiCheck.status === 'pass' ? 'operational' as const : 
                     apiCheck.status === 'warn' ? 'degraded' as const : 'offline' as const,
    };

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      performance: {
        memory: getMemoryUsage(),
        network: getNetworkInfo(),
        responseTime: Date.now() - startTime,
      },
      checks,
    };

    // Set appropriate HTTP status code
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, { status: statusCode });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    const errorStatus: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'offline',
        redis: 'offline',
        external_apis: 'offline',
      },
      performance: {
        responseTime: Date.now() - startTime,
      },
      checks: [{
        name: 'health_check_system',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Health check system failed',
        duration: Date.now() - startTime,
      }],
    };

    return NextResponse.json(errorStatus, { status: 503 });
  }
}

// Simple liveness probe
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}