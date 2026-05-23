import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../widgets/glassmorphic_panel.dart';

/// AI Assistant chat page — dark chat UI with glassmorphic input bar.
class AiAssistantPage extends StatefulWidget {
  const AiAssistantPage({super.key});

  @override
  State<AiAssistantPage> createState() => _AiAssistantPageState();
}

class _AiAssistantPageState extends State<AiAssistantPage> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<_ChatMessage> _messages = [
    _ChatMessage(
      text:
          'Привет! Я AI-советник по качеству воздуха в Бишкеке. '
          'Задайте мне вопрос о загрязнении, ТЭЦ, влиянии трафика или рекомендации по улучшению воздуха.',
      isUser: false,
      timestamp: DateTime.now(),
    ),
  ];
  bool _isSending = false;

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add(_ChatMessage(
        text: text,
        isUser: true,
        timestamp: DateTime.now(),
      ));
      _controller.clear();
      _isSending = true;
    });

    _scrollToBottom();

    // Simulate AI response (would integrate with backend in production)
    Future.delayed(const Duration(seconds: 1), () {
      if (!mounted) return;
      setState(() {
        _messages.add(_ChatMessage(
          text: _generateAiResponse(text),
          isUser: false,
          timestamp: DateTime.now(),
        ));
        _isSending = false;
      });
      _scrollToBottom();
    });
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  String _generateAiResponse(String question) {
    final q = question.toLowerCase();
    if (q.contains('тэц') || q.contains('теплоэлектро')) {
      return 'ТЭЦ Бишкек — один из главных источников загрязнения. '
          'При работе на угле (100% мощности) она вносит до 40% в общий AQI. '
          'Перевод на газ может снизить выбросы на 60-70%. '
          'Рекомендуется поэтапная модернизация с установкой фильтров.';
    }
    if (q.contains('трафик') || q.contains('пробки') || q.contains('машин')) {
      return 'Автотранспорт вносит ~35% в загрязнение. Основные проблемы: '
          'устаревший автопарк и перегруженность центральных улиц. '
          'Развитие общественного транспорта и ограничение въезда в центр '
          'может снизить AQI на 30-50 пунктов.';
    }
    if (q.contains('ветер') || q.contains('погод')) {
      return 'Ветер — ключевой природный фактор. При скорости >5 м/с смог '
          'активно рассеивается. Бишкек расположен в котловине, что затрудняет '
          'естественную вентиляцию, особенно зимой при температурной инверсии.';
    }
    if (q.contains('уголь') || q.contains('отопл')) {
      return 'Угольное отопление в частном секторе — третий по значимости '
          'источник загрязнения (~20% AQI). Переход на газовое или электрическое '
          'отопление может значительно улучшить качество воздуха зимой. '
          'Рекомендуется субсидирование перехода на чистые источники тепла.';
    }
    return 'Качество воздуха в Бишкеке зависит от множества факторов: '
        'работы ТЭЦ, интенсивности трафика, типов отопления в частном секторе '
        'и погодных условий. Попробуйте задать более конкретный вопрос о '
        'любом из этих факторов, и я предоставлю детальный анализ.';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.voidBlack,
      child: Column(
        children: [
          // ── Header ──
          _buildHeader(),
          // ── Messages ──
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              itemCount: _messages.length + (_isSending ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _messages.length && _isSending) {
                  return _buildTypingIndicator();
                }
                return _buildMessageBubble(_messages[index]);
              },
            ),
          ),
          // ── Input bar ──
          _buildInputBar(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.gunmetal, width: 1),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.signalBlue.withAlpha(20),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.smart_toy_outlined,
              color: AppColors.signalBlue,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'AI Советник',
                style: AppTypography.headingSm.copyWith(fontSize: 18),
              ),
              Text(
                'Анализ качества воздуха',
                style: AppTypography.bodySm.copyWith(color: AppColors.ash),
              ),
            ],
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: AppColors.mapGreen.withAlpha(30),
              borderRadius: BorderRadius.circular(100),
              border: Border.all(color: AppColors.mapGreen.withAlpha(60)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: AppColors.mapGreen,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  'Online',
                  style: AppTypography.bodySm.copyWith(
                    color: AppColors.mapGreen,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(_ChatMessage message) {
    final isUser = message.isUser;
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.55,
        ),
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isUser
              ? AppColors.signalBlue.withAlpha(25)
              : AppColors.deepCharcoal,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isUser ? 16 : 4),
            bottomRight: Radius.circular(isUser ? 4 : 16),
          ),
          border: Border.all(
            color: isUser
                ? AppColors.signalBlue.withAlpha(40)
                : AppColors.gunmetal,
            width: 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message.text,
              style: AppTypography.body.copyWith(
                color: isUser ? AppColors.white : AppColors.fog,
                fontSize: 14,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '${message.timestamp.hour.toString().padLeft(2, '0')}:'
              '${message.timestamp.minute.toString().padLeft(2, '0')}',
              style: AppTypography.caption.copyWith(
                color: AppColors.slate,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.deepCharcoal,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.gunmetal),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(3, (index) {
            return TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: 1),
              duration: Duration(milliseconds: 600 + index * 200),
              builder: (context, value, child) {
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: AppColors.signalBlue.withAlpha(
                      (100 + 155 * value).round(),
                    ),
                    shape: BoxShape.circle,
                  ),
                );
              },
            );
          }),
        ),
      ),
    );
  }

  Widget _buildInputBar() {
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.voidBlack.withAlpha(200),
            border: const Border(
              top: BorderSide(color: AppColors.gunmetal, width: 1),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: AppColors.deepCharcoal,
                    borderRadius: BorderRadius.circular(100),
                    border: Border.all(color: AppColors.steel, width: 1),
                  ),
                  child: TextField(
                    controller: _controller,
                    style: AppTypography.body.copyWith(
                      color: AppColors.white,
                      fontSize: 14,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Задайте вопрос о качестве воздуха...',
                      hintStyle: AppTypography.body.copyWith(
                        color: AppColors.slate,
                        fontSize: 14,
                      ),
                      border: InputBorder.none,
                      contentPadding:
                          const EdgeInsets.symmetric(vertical: 14),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTap: _sendMessage,
                child: Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.signalBlue,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.signalBlue.withAlpha(50),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.send_rounded,
                    color: AppColors.white,
                    size: 20,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;

  _ChatMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
  });
}
