import Script from "next/script";

const JsonLdScript = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": "https://readingchamp.co.kr/#organization",
        "name": "리딩챔프",
        "url": "https://readingchamp.co.kr",
        "logo": {
          "@type": "ImageObject",
          "url": "https://readingchamp.co.kr/logo.png",
          "width": 512,
          "height": 512
        },
        "description": "초등학생 영어 독해 학습 플랫폼. Lexile 지수 기반 맞춤 도서와 수능형 RC 문제로 체계적인 영어 학습을 제공합니다.",
        "sameAs": [
          "https://www.facebook.com/readingchamp",
          "https://www.instagram.com/readingchamp",
          "https://www.youtube.com/@readingchamp"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://readingchamp.co.kr/#website",
        "url": "https://readingchamp.co.kr",
        "name": "리딩챔프",
        "description": "아이의 영어 독해 실력, 매일 성장하는 습관",
        "publisher": {
          "@id": "https://readingchamp.co.kr/#organization"
        },
        "inLanguage": "ko-KR"
      },
      {
        "@type": "Course",
        "@id": "https://readingchamp.co.kr/#novel-course",
        "name": "Novel 영어 독서 프로그램",
        "description": "Lexile 지수 기반 5단계 레벨별 영어 도서 읽기와 챕터별 퀴즈를 통한 독해력 향상 프로그램",
        "provider": {
          "@id": "https://readingchamp.co.kr/#organization"
        },
        "courseMode": "온라인",
        "educationalLevel": "초등학교 1학년~중학교 2학년",
        "hasCourseInstance": [
          {
            "@type": "CourseInstance",
            "name": "Beginner (Lexile 500L+)",
            "description": "초등 1~2학년 대상, Lexile 500L 이상 도서"
          },
          {
            "@type": "CourseInstance",
            "name": "Intermediate (Lexile 600L+)",
            "description": "초등 2~3학년 대상, Lexile 600L 이상 도서"
          },
          {
            "@type": "CourseInstance",
            "name": "Advanced (Lexile 700L+)",
            "description": "초등 3~4학년 대상, Lexile 700L 이상 도서"
          },
          {
            "@type": "CourseInstance",
            "name": "Expert (Lexile 800L+)",
            "description": "초등 4~5학년 대상, Lexile 800L 이상 도서"
          },
          {
            "@type": "CourseInstance",
            "name": "Master (Lexile 900L+)",
            "description": "초등 5학년 이상 대상, Lexile 900L 이상 도서"
          }
        ]
      },
      {
        "@type": "Course",
        "@id": "https://readingchamp.co.kr/#rc-course",
        "name": "Reading Comprehension 프로그램",
        "description": "내신·수능 대비 4단계 레벨별 영어 독해 문제 풀이 프로그램. 매월 1000문제 이상 제공",
        "provider": {
          "@id": "https://readingchamp.co.kr/#organization"
        },
        "courseMode": "온라인",
        "educationalLevel": "초등학교 1학년~중학교 2학년",
        "hasCourseInstance": [
          {
            "@type": "CourseInstance",
            "name": "Beginner",
            "description": "초등 1~2학년 대상, 세트당 5문제, 총 150문제 제공"
          },
          {
            "@type": "CourseInstance",
            "name": "Intermediate",
            "description": "초등 3~4학년 대상, 세트당 7문제, 총 210문제 제공"
          },
          {
            "@type": "CourseInstance",
            "name": "Advanced",
            "description": "초등 5~6학년 대상, 세트당 10문제, 총 300문제 제공"
          },
          {
            "@type": "CourseInstance",
            "name": "Expert",
            "description": "중등 1~2학년 대상, 세트당 10문제, 총 300문제 제공"
          }
        ]
      },
      {
        "@type": "Product",
        "name": "리딩챔프 영어 독해 학습 서비스",
        "description": "Lexile 지수 기반 맞춤 도서, 수능형 RC 문제, 챕터별 퀴즈, 실시간 리더보드를 통한 종합 영어 독해 학습 플랫폼",
        "brand": {
          "@id": "https://readingchamp.co.kr/#organization"
        },
        "offers": {
          "@type": "Offer",
          "availability": "https://schema.org/InStock",
          "priceCurrency": "KRW",
          "url": "https://readingchamp.co.kr"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "1250"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "리딩챔프는 어떤 학생에게 적합한가요?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "리딩챔프는 초등학교 1학년부터 중학교 2학년까지의 학생들에게 적합합니다. Lexile 지수 500L부터 900L+까지 5단계 레벨로 구성되어 있어 학생의 실력에 맞는 학습이 가능합니다."
            }
          },
          {
            "@type": "Question",
            "name": "매월 제공되는 콘텐츠는 어떻게 구성되나요?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "매월 1일에 새로운 콘텐츠가 업데이트됩니다. Novel 섹션에서는 레벨별 4권씩 총 20권의 새로운 도서가, RC 섹션에서는 1000문제 이상의 독해 문제가 제공됩니다."
            }
          },
          {
            "@type": "Question",
            "name": "Lexile 지수란 무엇인가요?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Lexile 지수는 학생의 읽기 능력과 텍스트의 난이도를 측정하는 국제적인 지표입니다. 리딩챔프는 이 지수를 기반으로 학생에게 적합한 난이도의 도서를 추천합니다."
            }
          },
          {
            "@type": "Question",
            "name": "리더보드는 어떻게 활용되나요?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "리더보드를 통해 또래 학생들과 점수를 비교하며 독해 실력을 객관적으로 파악할 수 있습니다. 이를 통해 학습 동기부여와 적절한 난이도 조정이 가능합니다."
            }
          }
        ]
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "홈",
            "item": "https://readingchamp.co.kr"
          }
        ]
      }
    ]
  };

  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      strategy="afterInteractive"
    />
  );
};

export default JsonLdScript;