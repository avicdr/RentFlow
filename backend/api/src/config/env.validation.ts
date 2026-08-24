import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  @Min(1)
  PORT: number = 3001;

  @IsString()
  MONGO_URI: string;

  @IsString()
  JWT_ACCESS_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;
}

// Known dev-default secret values that must never be used in production.
const KNOWN_DEV_DEFAULTS = new Set([
  'dev-access-secret-change-in-production',
  'dev-refresh-secret-change-in-production',
  'dev-key-32-chars-change-in-prod!!',
  'dev-aadhaar-salt-change-in-prod!!!',
]);

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  const critical = errors.filter((e) =>
    ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].some((key) =>
      e.property === key,
    ),
  );

  const isProd = process.env.NODE_ENV === 'production';

  // In production, secrets must be present, long enough, and not left at a dev default.
  // Guards against silently running on the publicly-known fallback secrets in configuration.ts,
  // which would otherwise let anyone forge access tokens for any role.
  const secretProblems: string[] = [];
  if (isProd) {
    const secretsToCheck: Array<[string, number]> = [
      ['JWT_ACCESS_SECRET', 32],
      ['JWT_REFRESH_SECRET', 32],
      ['FIELD_ENCRYPTION_KEY', 16],
    ];
    for (const [key, minLen] of secretsToCheck) {
      const val = process.env[key];
      if (!val) {
        secretProblems.push(`${key} is required in production`);
      } else if (KNOWN_DEV_DEFAULTS.has(val)) {
        secretProblems.push(`${key} is set to a known dev default — change it`);
      } else if (val.length < minLen) {
        secretProblems.push(`${key} must be at least ${minLen} characters`);
      }
    }
  }

  if (isProd && (critical.length > 0 || secretProblems.length > 0)) {
    throw new Error(
      `Environment validation failed:\n${critical.toString()}${secretProblems.length ? '\n' + secretProblems.join('\n') : ''}`,
    );
  }

  return validatedConfig;
}
