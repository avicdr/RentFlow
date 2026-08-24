import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserStatus } from '../../users/schemas/user.schema';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  orgId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret'),
    });
  }

  /**
   * Called on every authenticated request after JWT signature is verified.
   * We do a lightweight DB lookup to catch suspended/deleted users whose
   * tokens haven't expired yet (critical now that TTL is 15 min, not 7 days).
   */
  async validate(payload: JwtPayload) {
    const user = await this.userModel
      .findById(payload.sub)
      .select('status isDeleted role organizationId')
      .lean();

    if (!user || user.isDeleted) {
      throw new UnauthorizedException('Account not found');
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account suspended. Contact support.');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: user.role,          // always use DB role, not stale JWT claim
      orgId: user.organizationId?.toString(),
      status: user.status,
    };
  }
}
