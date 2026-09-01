import { Controller, Get, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { RazorpayService } from './razorpay.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('LANDLORD', 'SUPER_ADMIN')
@Controller({ path: 'subscriptions', version: '1' })
export class SubscriptionsController {
  constructor(
    private readonly svc: SubscriptionsService,
    private readonly razorpaySvc: RazorpayService,
  ) { }

  @Get()
  getSubscription(@CurrentUser('id') userId: string) {
    return this.svc.getSubscription(userId).then(data => ({ data }));
  }

  // Manual tier change WITHOUT payment — restricted to platform admins only.
  // Landlords must go through create-order → verify-payment (a real payment) to upgrade.
  @Post('upgrade')
  @Roles('SUPER_ADMIN')
  upgrade(@Body('userId') userId: string, @Body('tier') tier: string, @Body('billingCycle') billingCycle?: string) {
    return this.svc.upgradeTier(userId, tier, billingCycle);
  }

  @Post('create-order')
  async createOrder(
    @CurrentUser('id') userId: string,
    @CurrentUser('email') email: string,
    @Body('tier') tier: string,
    @Body('billingCycle') billingCycle?: string,
  ) {
    const order = await this.razorpaySvc.createSubscriptionOrder(tier, userId, billingCycle);
    return { data: order };
  }

  @Post('verify-payment')
  async verifyPayment(
    @CurrentUser('id') userId: string,
    @Body('orderId') orderId: string,
    @Body('paymentId') paymentId: string,
    @Body('signature') signature: string,
  ) {
    const valid = this.razorpaySvc.verifyPaymentSignature(orderId, paymentId, signature);
    if (!valid) throw new BadRequestException('Payment signature verification failed');

    // Derive the tier from the verified order — never trust a client-supplied tier here,
    // otherwise a user could pay for LITE and claim ENTERPRISE.
    const { tier, billingCycle } = await this.razorpaySvc.getVerifiedTierForOrder(orderId, userId);

    await this.svc.upgradeTier(userId, tier, billingCycle);
    return { message: 'Payment verified and subscription upgraded', tier, billingCycle };
  }
}
