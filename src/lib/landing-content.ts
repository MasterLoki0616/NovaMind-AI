export type LandingLanguage = "en" | "tr";

type LandingCopy = {
  meta: {
    title: string;
    description: string;
  };
  language: {
    label: string;
    english: string;
    turkish: string;
  };
  nav: {
    about: string;
    features: string;
    faq: string;
    contact: string;
  };
  actions: {
    getStarted: string;
    learnMore: string;
    becomeInvestor: string;
    comingSoon: string;
    currentlyUnavailable: string;
  };
  hero: {
    badge: string;
    title: string;
    titleAccent: string;
    description: string;
    stats: Array<{ label: string; value: string }>;
    preview: {
      title: string;
      subtitle: string;
      status: string;
      chips: string[];
      note: string;
      sessionLabel: string;
      sessionTitle: string;
      userMessage: string;
      assistantMessage: string;
    };
  };
  about: {
    eyebrow: string;
    title: string;
    description: string;
    cards: Array<{ title: string; text: string }>;
  };
  vision: {
    eyebrow: string;
    title: string;
    description: string;
    cards: Array<{ title: string; text: string }>;
  };
  features: {
    eyebrow: string;
    title: string;
    description: string;
    items: Array<{ title: string; text: string }>;
  };
  upcoming: {
    eyebrow: string;
    title: string;
    description: string;
    items: Array<{ title: string; text: string }>;
  };
  download: {
    title: string;
    description: string;
    options: Array<{ label: string; detail: string }>;
  };
  whyChoose: {
    eyebrow: string;
    title: string;
    description: string;
    reasons: string[];
  };
  faq: {
    eyebrow: string;
    title: string;
    description: string;
    items: Array<{ question: string; answer: string }>;
  };
  founder: {
    eyebrow: string;
    role: string;
    story: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    description: string;
    instagram: string;
    linkedin: string;
    email: string;
  };
  investors: {
    eyebrow: string;
    title: string;
    description: string;
    signals: string[];
  };
  footer: {
    copyright: string;
    instagram: string;
  };
};

export const landingContent: Record<LandingLanguage, LandingCopy> = {
  en: {
    meta: {
      title: "NovaMind AI | Your Second Brain Powered by AI",
      description:
        "NovaMind AI is a premium AI startup building your second brain for screen understanding, voice interaction, memory, and automation."
    },
    language: {
      label: "Language",
      english: "English",
      turkish: "Türkçe"
    },
    nav: {
      about: "About",
      features: "Features",
      faq: "FAQ",
      contact: "Contact"
    },
    actions: {
      getStarted: "Get Started",
      learnMore: "Learn More",
      becomeInvestor: "Become an Investor",
      comingSoon: "Coming Soon",
      currentlyUnavailable: "Currently Unavailable"
    },
    hero: {
      badge: "Premium AI startup for the future of work",
      title: "Your Second Brain",
      titleAccent: "Powered by AI",
      description:
        "NovaMind AI is building an intelligent layer that understands your screen, listens to your voice, remembers context, and helps you move faster with elegant automation.",
      stats: [
        { label: "Screen-aware", value: "Live visual context" },
        { label: "Memory-backed", value: "Longer continuity" },
        { label: "Automation-first", value: "More leverage" }
      ],
      preview: {
        title: "NovaMind Interface",
        subtitle: "Clean, fast, context-rich assistance",
        status: "Live concept",
        chips: ["Screen help", "Voice flow", "Memory layer"],
        note: "A calmer AI product built to feel premium, capable, and always useful.",
        sessionLabel: "Session",
        sessionTitle: "One workspace for intelligence and action",
        userMessage: "Explain the issue, keep my context, and help me fix it.",
        assistantMessage:
          "NovaMind combines chat, voice, screen understanding, and memory so every next step feels faster."
      }
    },
    about: {
      eyebrow: "About NovaMind",
      title: "A modern AI startup built around intelligence, productivity, and future vision.",
      description:
        "NovaMind AI is being designed as a single AI layer for thinking, doing, and automating. The goal is simple: reduce digital friction and turn intelligence into daily leverage.",
      cards: [
        {
          title: "AI-powered assistant",
          text: "A product direction centered on useful, action-ready intelligence."
        },
        {
          title: "Productivity engine",
          text: "Built to speed up the path from idea to execution."
        },
        {
          title: "Future-ready vision",
          text: "Memory, agents, sync, and advanced automation over time."
        },
        {
          title: "Clear by design",
          text: "Minimal layout, premium motion, and startup-level polish."
        }
      ]
    },
    vision: {
      eyebrow: "Vision & Mission",
      title: "Building the AI layer that ambitious people will rely on every day.",
      description:
        "NovaMind AI is not being built as another chatbot. The long-term vision is a daily operating layer for thinking, creating, automating, and making decisions with more clarity and less friction.",
      cards: [
        {
          title: "Vision",
          text: "Create a future where AI feels native to work, learning, and personal productivity."
        },
        {
          title: "Mission",
          text: "Turn advanced intelligence into a clean, understandable product people trust and enjoy using."
        },
        {
          title: "Why it matters",
          text: "The market is moving toward deeper AI integration, and NovaMind AI is positioned to become a premium interface in that shift."
        }
      ]
    },
    features: {
      eyebrow: "Core Features",
      title: "Powerful capabilities that still feel simple and futuristic.",
      description:
        "Each feature is aimed at a clean, high-conversion message: NovaMind helps you understand more, move faster, and automate the repetitive parts.",
      items: [
        { title: "Smart AI Chat", text: "Human-like conversation that stays useful." },
        { title: "Screen Understanding", text: "AI sees the live context on your screen." },
        { title: "Voice Interaction", text: "Natural voice control with faster flows." },
        { title: "Memory System", text: "A second-brain layer that remembers what matters." },
        { title: "Personal Assistant", text: "A focused AI partner for daily execution." },
        { title: "Project Fixing", text: "Spot issues fast and move toward a fix." },
        { title: "Terminal Automation", text: "Command-safe workflows for technical users." },
        { title: "Open & Close Apps", text: "Reduce friction across repeated routines." },
        { title: "Code Support", text: "Generate, explain, and debug faster." },
        { title: "Task Automation", text: "Delegate repetitive work and keep momentum." }
      ]
    },
    upcoming: {
      eyebrow: "Coming Soon",
      title: "The roadmap is already bigger than the first release.",
      description:
        "NovaMind AI is growing toward agents, sync, and deeper personalization. The near future is about making the assistant feel even more continuous and more powerful.",
      items: [
        {
          title: "Autonomous Agents",
          text: "Persistent AI workers that plan and report back."
        },
        {
          title: "Multi-device Sync",
          text: "A continuous NovaMind experience across devices."
        },
        {
          title: "Advanced Personalization",
          text: "Deeper memory, behavior, and adaptation."
        }
      ]
    },
    download: {
      title: "Download channels are designed now. Public launch is coming next.",
      description:
        "Desktop and mobile releases are planned, but the buttons stay visually disabled until launch. The product direction stays visible without pretending availability.",
      options: [
        { label: "Desktop", detail: "Windows / macOS" },
        { label: "App Store", detail: "iPhone & iPad" },
        { label: "Google Play", detail: "Android" }
      ]
    },
    whyChoose: {
      eyebrow: "Why Choose Us",
      title: "Built for people who want leverage, not just answers.",
      description:
        "NovaMind AI is aimed at users who care about speed, clarity, smarter interfaces, and AI that actually reduces friction in daily work.",
      reasons: [
        "Faster than generic assistants",
        "Screen-aware intelligence",
        "Clean premium UI",
        "Privacy-focused direction",
        "Automation-first product design"
      ]
    },
    faq: {
      eyebrow: "FAQ",
      title: "Simple answers to the first questions people usually ask.",
      description:
        "The ambition is large, but the message stays simple: NovaMind AI is being built to feel useful immediately and more valuable over time.",
      items: [
        {
          question: "What is NovaMind AI?",
          answer:
            "NovaMind AI is a premium assistant designed to feel like your second brain for work, learning, and execution."
        },
        {
          question: "When will it be available?",
          answer:
            "The public site is live now while the product continues toward a broader release."
        },
        {
          question: "Is it free?",
          answer:
            "The plan is to make the product accessible first, then expand into premium capability tiers."
        },
        {
          question: "How is it different?",
          answer:
            "NovaMind aims to combine memory, screen understanding, voice, and automation in one cleaner experience."
        }
      ]
    },
    founder: {
      eyebrow: "Founder",
      role: "Founder & Creator",
      story:
        "NovaMind AI began with one belief: software should feel more alive, more useful, and more aligned with the way ambitious people actually think and build."
    },
    contact: {
      eyebrow: "Contact",
      title: "Stay close to the build.",
      description:
        "Follow NovaMind AI for updates, launches, partnerships, and future product drops.",
      instagram: "Instagram",
      linkedin: "LinkedIn",
      email: "Email"
    },
    investors: {
      eyebrow: "Sponsors / Investors",
      title: "We are looking for investors who believe AI should become a daily operating layer.",
      description:
        "NovaMind AI sits between assistant software, memory systems, automation, and premium product design. It is an early-stage bet on how personal computing will evolve.",
      signals: ["High upside", "Global demand", "Strong direction"]
    },
    footer: {
      copyright: "© 2026 NovaMind AI. Built for a future where intelligence feels native.",
      instagram: "Instagram"
    }
  },
  tr: {
    meta: {
      title: "NovaMind AI | Yapay Zeka Destekli İkinci Beynin",
      description:
        "NovaMind AI; ekran anlayışı, sesli etkileşim, hafıza ve otomasyon üzerine kurulu premium bir yapay zeka girişimidir."
    },
    language: {
      label: "Dil",
      english: "English",
      turkish: "Türkçe"
    },
    nav: {
      about: "Hakkımızda",
      features: "Özellikler",
      faq: "SSS",
      contact: "İletişim"
    },
    actions: {
      getStarted: "Başla",
      learnMore: "Daha Fazla",
      becomeInvestor: "Yatırımcı Ol",
      comingSoon: "Yakında",
      currentlyUnavailable: "Şu Anda Kullanılamıyor"
    },
    hero: {
      badge: "İşin geleceği için premium yapay zeka girişimi",
      title: "İkinci Beynin",
      titleAccent: "Yapay Zeka ile Güçleniyor",
      description:
        "NovaMind AI; ekranını anlayan, sesini dinleyen, bağlamı hatırlayan ve zarif otomasyonlarla daha hızlı ilerlemene yardım eden akıllı bir katman geliştiriyor.",
      stats: [
        { label: "Ekran farkındalığı", value: "Canlı görsel bağlam" },
        { label: "Hafıza destekli", value: "Daha uzun süreklilik" },
        { label: "Otomasyon odaklı", value: "Daha fazla kaldıraç" }
      ],
      preview: {
        title: "NovaMind Arayüzü",
        subtitle: "Temiz, hızlı ve bağlam açısından zengin yardım",
        status: "Canlı konsept",
        chips: ["Ekran yardımı", "Ses akışı", "Hafıza katmanı"],
        note: "Premium, güçlü ve her zaman faydalı hissettiren daha sakin bir AI ürünü.",
        sessionLabel: "Oturum",
        sessionTitle: "Zeka ve aksiyon için tek çalışma alanı",
        userMessage: "Sorunu açıkla, bağlamımı koru ve çözmeme yardım et.",
        assistantMessage:
          "NovaMind; sohbeti, sesi, ekran anlayışını ve hafızayı birleştirerek bir sonraki adımı daha hızlı hale getirir."
      }
    },
    about: {
      eyebrow: "NovaMind Hakkında",
      title: "Zeka, üretkenlik ve gelecek vizyonu etrafında kurulan modern bir AI girişimi.",
      description:
        "NovaMind AI; düşünmek, üretmek ve otomasyon kurmak için tek bir yapay zeka katmanı olarak tasarlanıyor. Amaç basit: dijital sürtünmeyi azaltmak ve zekayı günlük kaldıraç haline getirmek.",
      cards: [
        {
          title: "AI destekli asistan",
          text: "Faydalı ve aksiyona dönük zekâ üzerine kurulu bir ürün yönü."
        },
        {
          title: "Üretkenlik motoru",
          text: "Fikirden uygulamaya giden yolu hızlandırmak için tasarlandı."
        },
        {
          title: "Geleceğe hazır vizyon",
          text: "Zaman içinde hafıza, ajanlar, senkronizasyon ve gelişmiş otomasyon."
        },
        {
          title: "Tasarımda netlik",
          text: "Minimal düzen, premium hareket ve startup seviyesinde estetik."
        }
      ]
    },
    vision: {
      eyebrow: "Vizyon & Misyon",
      title: "Hırslı insanların her gün güveneceği yapay zeka katmanını inşa etmek.",
      description:
        "NovaMind AI başka bir chatbot olarak konumlanmıyor. Uzun vadeli vizyon; düşünme, üretme, otomasyon ve karar alma süreçlerinde günlük bir işletim katmanı haline gelmek.",
      cards: [
        {
          title: "Vizyon",
          text: "Yapay zekanın iş, öğrenme ve kişisel üretkenlikte doğal hissettiği bir gelecek kurmak."
        },
        {
          title: "Misyon",
          text: "Gelişmiş zekayı insanların güvendiği ve kullanmaktan keyif aldığı temiz bir ürüne dönüştürmek."
        },
        {
          title: "Neden önemli",
          text: "Pazar daha derin AI entegrasyonuna gidiyor ve NovaMind AI bu dönüşümde premium bir arayüz olabilecek konumda."
        }
      ]
    },
    features: {
      eyebrow: "Temel Özellikler",
      title: "Güçlü ama hâlâ sade ve futuristik hissettiren yetenekler.",
      description:
        "Her özellik tek bir mesaj taşıyor: NovaMind daha iyi anlamanı, daha hızlı ilerlemeni ve tekrarlayan işi otomatikleştirmeni sağlar.",
      items: [
        { title: "Akıllı AI Sohbet", text: "İnsan gibi ama gerçekten faydalı kalan konuşmalar." },
        { title: "Ekran Anlayışı", text: "AI, ekrandaki canlı bağlamı görür ve yorumlar." },
        { title: "Sesli Etkileşim", text: "Daha hızlı akışlar için doğal ses kontrolü." },
        { title: "Hafıza Sistemi", text: "Önemli olanı hatırlayan ikinci beyin katmanı." },
        { title: "Kişisel Asistan", text: "Günlük yürütme için odaklı bir AI partneri." },
        { title: "Proje Düzeltme", text: "Sorunları hızlı fark et ve çözüme yaklaş." },
        { title: "Terminal Otomasyonu", text: "Teknik kullanıcılar için güvenli komut akışları." },
        { title: "Uygulama Aç/Kapat", text: "Tekrarlayan rutinlerde sürtünmeyi azalt." },
        { title: "Kod Desteği", text: "Daha hızlı üret, açıkla ve debug et." },
        { title: "Görev Otomasyonu", text: "Tekrarlayan işi devret ve hızını koru." }
      ]
    },
    upcoming: {
      eyebrow: "Yakında",
      title: "Yol haritası ilk sürümden çok daha büyük.",
      description:
        "NovaMind AI; ajanlara, senkronizasyona ve daha derin kişiselleştirmeye doğru büyüyor. Yakın gelecek, asistanı daha sürekli ve daha güçlü hale getirmekle ilgili.",
      items: [
        {
          title: "Otonom Ajanlar",
          text: "Plan yapan ve geri raporlayan kalıcı AI çalışanları."
        },
        {
          title: "Çoklu Cihaz Senkronizasyonu",
          text: "Cihazlar arasında kesintisiz NovaMind deneyimi."
        },
        {
          title: "Gelişmiş Kişiselleştirme",
          text: "Daha derin hafıza, davranış ve uyum."
        }
      ]
    },
    download: {
      title: "İndirme kanalları hazırlandı. Halka açık lansman sıradaki adım.",
      description:
        "Masaüstü ve mobil sürümler planlandı, ancak butonlar lansmana kadar görsel olarak pasif kalacak. Böylece ürün yönü görünür olurken kullanılabilirlik numarası yapılmıyor.",
      options: [
        { label: "Masaüstü", detail: "Windows / macOS" },
        { label: "App Store", detail: "iPhone & iPad" },
        { label: "Google Play", detail: "Android" }
      ]
    },
    whyChoose: {
      eyebrow: "Neden Biz?",
      title: "Sadece cevap değil, kaldıraç isteyen insanlar için üretildi.",
      description:
        "NovaMind AI; hız, netlik, daha akıllı arayüzler ve gerçekten sürtünmeyi azaltan AI isteyen kullanıcılar için tasarlanıyor.",
      reasons: [
        "Genel asistanlardan daha hızlı",
        "Ekran farkındalığına sahip zeka",
        "Temiz premium arayüz",
        "Gizlilik odaklı yön",
        "Otomasyon öncelikli ürün tasarımı"
      ]
    },
    faq: {
      eyebrow: "SSS",
      title: "İnsanların ilk sorduğu sorulara basit cevaplar.",
      description:
        "Vizyon büyük, mesaj ise basit: NovaMind AI ilk andan itibaren faydalı ve zamanla daha da değerli olacak şekilde tasarlanıyor.",
      items: [
        {
          question: "NovaMind AI nedir?",
          answer:
            "NovaMind AI; iş, öğrenme ve yürütme süreçlerinde ikinci beyin gibi hissettirmesi amaçlanan premium bir asistandır."
        },
        {
          question: "Ne zaman çıkacak?",
          answer:
            "Halka açık site şu an yayında, ürün ise daha geniş çıkışa doğru aktif şekilde geliştiriliyor."
        },
        {
          question: "Ücretsiz mi olacak?",
          answer:
            "Plan, önce erişilebilir bir başlangıç deneyimi sunmak ve ardından premium yetenek katmanlarına genişlemektir."
        },
        {
          question: "Farkı ne?",
          answer:
            "NovaMind; hafıza, ekran anlayışı, ses ve otomasyonu tek ve daha temiz bir deneyimde birleştirmeyi hedefler."
        }
      ]
    },
    founder: {
      eyebrow: "Kurucu",
      role: "Kurucu & Yaratıcı",
      story:
        "NovaMind AI tek bir inançla başladı: yazılım daha canlı, daha faydalı ve insanların düşünme-biçimiyle daha uyumlu hissettirmeli."
    },
    contact: {
      eyebrow: "İletişim",
      title: "Gelişimi yakından takip et.",
      description:
        "NovaMind AI güncellemeleri, lansmanlar, iş birlikleri ve gelecek ürün adımları için bizimle bağlantıda kal.",
      instagram: "Instagram",
      linkedin: "LinkedIn",
      email: "E-posta"
    },
    investors: {
      eyebrow: "Sponsorlar / Yatırımcılar",
      title: "Yapay zekanın günlük bir işletim katmanına dönüşeceğine inanan yatırımcılar arıyoruz.",
      description:
        "NovaMind AI; asistan yazılımı, hafıza sistemleri, otomasyon ve premium ürün tasarımının kesişiminde yer alıyor. Bu, kişisel bilişimin nasıl evrileceğine dair erken aşama bir fırsat.",
      signals: ["Yüksek potansiyel", "Küresel talep", "Güçlü yön"]
    },
    footer: {
      copyright: "© 2026 NovaMind AI. Zekânın doğal hissettiği bir gelecek için üretildi.",
      instagram: "Instagram"
    }
  }
};
