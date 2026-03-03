
export interface NewsItem {
    id: string;
    title: string;
    content: string;
    source: string;
    timestamp: number;
    category: 'STOCKS' | 'CRYPTO' | 'FOREX' | 'MACRO';
    region: 'GLOBAL' | 'INDIA' | 'USA' | 'EUROPE' | 'ASIA';
    sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    importance: 'HIGH' | 'MEDIUM' | 'LOW';
    author?: string;
    handle?: string; // For Twitter-like posts
    link?: string;
}

export const MOCK_NEWS: NewsItem[] = [
    {
        id: '1',
        title: "Fed's Jerome Powell Hints at Potential Rate Cut in Upcoming Meeting",
        content: "During the recent economic forum, Powell indicated that the inflation targets are being met faster than anticipated, opening the door for a policy shift.",
        source: "Institutional Feed",
        timestamp: Date.now() - 1000 * 60 * 15,
        category: 'MACRO',
        region: 'USA',
        sentiment: 'BULLISH',
        importance: 'HIGH'
    },
    {
        id: 'in-1',
        title: "RBI Maintains Repo Rate at 6.5%; Focuses on Inflation Targeting",
        content: "The Reserve Bank of India decided to keep the rates unchanged while maintaining a 'withdrawal of accommodation' stance to ensure inflation aligns with the target.",
        source: "Economic Times",
        timestamp: Date.now() - 1000 * 60 * 25,
        category: 'MACRO',
        region: 'INDIA',
        sentiment: 'NEUTRAL',
        importance: 'HIGH'
    },
    {
        id: '2',
        title: "Tesla Q4 Earnings Beat Expectations; Energy Segment Growing 40% YoY",
        content: "Elon Musk highlights the shift towards full autonomy as the primary value driver for the company moving into 2026.",
        source: "Reuters Finance",
        timestamp: Date.now() - 1000 * 60 * 45,
        category: 'STOCKS',
        region: 'USA',
        sentiment: 'BULLISH',
        importance: 'HIGH'
    },
    {
        id: 'in-2',
        title: "Nifty 50 Hits Record High as Foreign Institutional Investors Return",
        content: "Strong quarterly earnings and positive global cues drive Indian benchmarks to new psychological levels. Large-cap banking stocks lead the rally.",
        source: "Mint",
        timestamp: Date.now() - 1000 * 60 * 10,
        category: 'STOCKS',
        region: 'INDIA',
        sentiment: 'BULLISH',
        importance: 'HIGH'
    },
    {
        id: '3',
        title: "OPEC+ Considering Additional Supply Cuts Amid Global Demand Uncertainty",
        content: "Sources suggest a coordinated effort to stabilize oil prices as global manufacturing data shows signs of slowing down.",
        source: "Bloomberg",
        timestamp: Date.now() - 1000 * 60 * 120,
        category: 'FOREX',
        region: 'GLOBAL',
        sentiment: 'BEARISH',
        importance: 'MEDIUM'
    },
    {
        id: '4',
        title: "Bitcoin Crosses $100k for the FIRST TIME in History",
        content: "Institutional adoption and the launch of new Spot ETFs in Asia drive the premier cryptocurrency to record highs.",
        source: "Deep Market Scan",
        timestamp: Date.now() - 1000 * 60 * 5,
        category: 'CRYPTO',
        region: 'GLOBAL',
        sentiment: 'BULLISH',
        importance: 'HIGH'
    },
    {
        id: 'eu-1',
        title: "ECB Signals Faster Pace of Inflation Normalization in Eurozone",
        content: "Inflation across the Euro area is cooling faster than previously projected, leading to discussions about an early summer rate cut.",
        source: "Financial Times",
        timestamp: Date.now() - 1000 * 60 * 90,
        category: 'MACRO',
        region: 'EUROPE',
        sentiment: 'BULLISH',
        importance: 'MEDIUM'
    }
];

export const MOCK_SOCIAL: NewsItem[] = [
    {
        id: 'social-1',
        title: "Inflation is a hidden tax on the people.",
        content: "The debasement of currency continues. Hard assets are the only hedge in a world of infinite printing.",
        source: "Cassandra (Michael Burry)",
        handle: "@michaelburry",
        timestamp: Date.now() - 1000 * 60 * 30,
        category: 'MACRO',
        region: 'USA',
        sentiment: 'BEARISH',
        importance: 'HIGH'
    },
    {
        id: 'social-4',
        title: "Federal Reserve Board meeting minutes.",
        content: "Committee participants generally noted that the current stance of monetary policy appeared restrictive. Several participants noted that risks to the inflation outlook remained tilted to the upside.",
        source: "Federal Reserve",
        handle: "@federalreserve",
        timestamp: Date.now() - 1000 * 60 * 15,
        category: 'MACRO',
        region: 'USA',
        sentiment: 'NEUTRAL',
        importance: 'HIGH'
    },
    {
        id: 'social-in-1',
        title: "India's growth story is just beginning.",
        content: "The digital public infrastructure and manufacturing push are creating a multi-decade boom. $NIFTY looking strong for the next decade.",
        source: "Capital Mind",
        handle: "@capitalmind",
        timestamp: Date.now() - 1000 * 60 * 40,
        category: 'STOCKS',
        region: 'INDIA',
        sentiment: 'BULLISH',
        importance: 'MEDIUM'
    },
    {
        id: 'social-2',
        title: "Exciting progress on FSD v14.",
        content: "We are reaching near-human levels of intervention-free driving. Real world AI is the hardest problem to solve.",
        source: "Elon Musk",
        handle: "@elonmusk",
        timestamp: Date.now() - 1000 * 60 * 60,
        category: 'STOCKS',
        region: 'USA',
        sentiment: 'BULLISH',
        importance: 'MEDIUM'
    }
];

export const generateLiveNews = (): NewsItem => {
    const sources = ["Bloomberg", "Reuters", "CNBC", "Financial Times", "Wall Street Journal", "Mint", "Economic Times"];
    const categories: NewsItem['category'][] = ["STOCKS", "CRYPTO", "FOREX", "MACRO"];
    const regions: NewsItem['region'][] = ["GLOBAL", "INDIA", "USA", "EUROPE", "ASIA"];
    const sentiments: NewsItem['sentiment'][] = ["BULLISH", "BEARISH", "NEUTRAL"];

    return {
        id: Math.random().toString(36).substr(2, 9),
        title: "Breaking: " + ["Market Volatility Spike", "New Economic Stimulus Package", "Tech Sector Rally", "Oil Price Drop", "GDP Data Beat"][Math.floor(Math.random() * 5)],
        content: "Latest updates from the trading floor indicate significant movements in global indices.",
        source: sources[Math.floor(Math.random() * sources.length)],
        timestamp: Date.now(),
        category: categories[Math.floor(Math.random() * categories.length)],
        region: regions[Math.floor(Math.random() * regions.length)],
        sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
        importance: Math.random() > 0.7 ? 'HIGH' : 'MEDIUM'
    };
};

