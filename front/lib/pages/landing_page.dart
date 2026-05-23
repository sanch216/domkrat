import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../widgets/pill_buttons.dart';
import '../widgets/mapbox_map.dart';

/// Landing page with hero section, demo map, and CTA buttons.
class LandingPage extends StatefulWidget {
  const LandingPage({super.key});

  @override
  State<LandingPage> createState() => _LandingPageState();
}

class _LandingPageState extends State<LandingPage>
    with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOutCubic,
    ));
    _fadeController.forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.voidBlack,
      body: Stack(
        children: [
          // ── Content ──
          SingleChildScrollView(
            child: Column(
              children: [
                // Spacer for nav bar
                const SizedBox(height: 62),
                // ── Hero Section ──
                _buildHeroSection(context),
                // ── Map Demo ──
                _buildMapDemo(context),
                const SizedBox(height: 96),
                // ── Features Section ──
                _buildFeaturesSection(context),
                const SizedBox(height: 96),
                // ── Footer ──
                _buildFooter(context),
              ],
            ),
          ),
          // ── Navigation Bar ──
          _buildNavBar(context),
        ],
      ),
    );
  }

  Widget _buildNavBar(BuildContext context) {
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          height: 62,
          padding: const EdgeInsets.symmetric(horizontal: 32),
          decoration: BoxDecoration(
            color: AppColors.voidBlack.withAlpha(200),
            border: const Border(
              bottom: BorderSide(color: AppColors.gunmetal, width: 1),
            ),
          ),
          child: Row(
            children: [
              // Logo
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.signalBlue,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.air, color: AppColors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Text(
                'DOMKRAT',
                style: AppTypography.caption.copyWith(
                  color: AppColors.white,
                  letterSpacing: 2.5,
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Spacer(),
              // Right-side CTA
              PrimaryPillButton(
                label: 'Открыть приложение',
                icon: Icons.arrow_forward_rounded,
                height: 40,
                onPressed: () =>
                    Navigator.of(context).pushReplacementNamed('/app'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeroSection(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnimation,
      child: SlideTransition(
        position: _slideAnimation,
        child: Container(
          width: double.infinity,
          constraints: const BoxConstraints(maxWidth: 1344),
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 96),
          alignment: Alignment.center,
          child: Column(
            children: [
              // Badge
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.mapGreen,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'BISHKEK AIR QUALITY',
                  style: AppTypography.caption.copyWith(
                    color: AppColors.white,
                    letterSpacing: 1.0,
                  ),
                ),
              ),
              const SizedBox(height: 32),
              // Headline
              Text(
                'Чистый воздух\nдля Бишкека',
                textAlign: TextAlign.center,
                style: AppTypography.display.copyWith(
                  fontSize: _responsiveDisplaySize(context),
                ),
              ),
              const SizedBox(height: 24),
              // Subtext
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 560),
                child: Text(
                  'Визуализация и симуляция загрязнения воздуха в реальном времени. '
                  'Анализируйте влияние ТЭЦ, трафика и отопления на качество воздуха.',
                  textAlign: TextAlign.center,
                  style: AppTypography.subheading,
                ),
              ),
              const SizedBox(height: 40),
              // CTA Buttons
              Wrap(
                spacing: 16,
                runSpacing: 12,
                alignment: WrapAlignment.center,
                children: [
                  PrimaryPillButton(
                    label: 'Открыть приложение',
                    icon: Icons.play_arrow_rounded,
                    onPressed: () =>
                        Navigator.of(context).pushReplacementNamed('/app'),
                  ),
                  OutlinedPillButton(
                    label: 'Узнать больше',
                    icon: Icons.info_outline_rounded,
                    onPressed: () {},
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMapDemo(BuildContext context) {
    return Center(
      child: Container(
        constraints: const BoxConstraints(maxWidth: 1200),
        height: 500,
        margin: const EdgeInsets.symmetric(horizontal: 32),
        child: Stack(
          children: [
            // Map
            ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: const MapboxMapWidget(
                mapId: 'landing-map',
                initialZoom: 11.5,
              ),
            ),
            // Bottom inset shadow (dissolve into background)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              height: 180,
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(24),
                    bottomRight: Radius.circular(24),
                  ),
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [
                      AppColors.voidBlack,
                      AppColors.voidBlack.withAlpha(180),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeaturesSection(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 1344),
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        children: [
          Text(
            'ВОЗМОЖНОСТИ',
            style: AppTypography.caption.copyWith(
              color: AppColors.slate,
              letterSpacing: 2,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Всё для мониторинга воздуха',
            style: AppTypography.headingLg,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 48),
          Wrap(
            spacing: 24,
            runSpacing: 24,
            alignment: WrapAlignment.center,
            children: [
              _featureCard(
                Icons.map_outlined,
                'Живая карта',
                'Ветер, пробки и смог в реальном времени на интерактивной карте Бишкека.',
              ),
              _featureCard(
                Icons.tune_outlined,
                'Симуляция',
                'Настройте параметры ТЭЦ, трафика и отопления — увидьте результат мгновенно.',
              ),
              _featureCard(
                Icons.smart_toy_outlined,
                'AI Советник',
                'Получайте рекомендации от ИИ-помощника по улучшению качества воздуха.',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _featureCard(IconData icon, String title, String description) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 360,
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: AppColors.deepCharcoal,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.gunmetal, width: 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.signalBlue.withAlpha(20),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: AppColors.signalBlue, size: 24),
            ),
            const SizedBox(height: 20),
            Text(title, style: AppTypography.headingSm),
            const SizedBox(height: 8),
            Text(description, style: AppTypography.body),
          ],
        ),
      ),
    );
  }

  Widget _buildFooter(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 32),
      decoration: const BoxDecoration(
        border: Border(
          top: BorderSide(color: AppColors.gunmetal, width: 1),
        ),
      ),
      child: Center(
        child: Text(
          '© 2026 Domkrat — Hackathon AI Hub',
          style: AppTypography.bodySm.copyWith(color: AppColors.slate),
        ),
      ),
    );
  }

  double _responsiveDisplaySize(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    if (width > 1200) return 68;
    if (width > 800) return 52;
    if (width > 500) return 40;
    return 32;
  }
}
