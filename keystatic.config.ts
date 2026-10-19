import { config, fields, collection, singleton } from '@keystatic/core';

const repoOwner = process.env.KEYSTATIC_GITHUB_OWNER;
const repoName = process.env.KEYSTATIC_GITHUB_REPO;

export default config({
  storage:
    repoOwner && repoName
      ? { kind: 'github', repo: { owner: repoOwner, name: repoName } }
      : { kind: 'local' },

  ui: {
    brand: { name: 'GameNews CMS' },
  },

  singletons: {
    siteSettings: singleton({
      label: 'Site Settings',
      path: 'src/content/site-settings',
      format: { data: 'json' },
      schema: {
        siteName: fields.text({ label: 'Site name', defaultValue: 'GameNews' }),
        tagline: fields.text({
          label: 'Tagline',
          defaultValue: 'App reviews, tutorials, and troubleshooting guides',
        }),
        businessLegalName: fields.text({
          label: 'Business / publisher legal name (for Privacy Policy & Terms)',
          description: 'Required before launch. Leave blank only during development.',
          defaultValue: '',
        }),
        contactEmail: fields.text({
          label: 'Public contact email',
          defaultValue: '',
        }),
        contactAddress: fields.text({
          label: 'Business address (optional, shown in legal pages if provided)',
          multiline: true,
          defaultValue: '',
        }),
        socialLinks: fields.array(
          fields.object({
            platform: fields.text({ label: 'Platform (e.g. X, Facebook)' }),
            url: fields.url({ label: 'URL' }),
          }),
          {
            label: 'Social links',
            itemLabel: (props) => props.fields.platform.value || 'Social link',
          }
        ),

        // --- Analytics ---
        analyticsProvider: fields.select({
          label: 'Analytics provider',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Plausible (cookieless)', value: 'plausible' },
            { label: 'Google Analytics 4', value: 'ga4' },
          ],
          defaultValue: 'none',
        }),
        analyticsId: fields.text({
          label: 'Analytics site ID / measurement ID',
          description: 'Plausible: your domain. GA4: measurement ID (e.g. G-XXXXXXX).',
          defaultValue: '',
        }),

        // --- Consent management platform (CMP) ---
        cmpProvider: fields.select({
          label: 'Consent management platform (CMP)',
          description:
            'Required by Google before serving personalized ads to visitors in the EEA, UK, or Switzerland. Must be a Google-certified, IAB TCF-integrated CMP. Selecting one here only loads its script — see "CMP verified" below before it counts as compliant.',
          options: [
            { label: 'None configured yet', value: 'none' },
            { label: 'Cookiebot', value: 'cookiebot' },
            { label: 'CookieYes', value: 'cookieyes' },
            { label: 'Custom (paste script tag)', value: 'custom' },
          ],
          defaultValue: 'none',
        }),
        cmpSiteId: fields.text({
          label: 'CMP site/domain-group ID',
          description:
            'Required when provider is Cookiebot or CookieYes — ads stay disabled without it, regardless of the ' +
            'checkbox below. Cookiebot: data-cbid value. CookieYes: client key from your install snippet.',
          defaultValue: '',
        }),
        cmpCustomScript: fields.text({
          label: 'Custom CMP script tag (only used when provider is "Custom")',
          description:
            'Required when provider is Custom — ads stay disabled without it. Paste the exact <script> tag your ' +
            'CMP dashboard gives you.',
          multiline: true,
          defaultValue: '',
        }),
        cmpConfiguredAndVerified: fields.checkbox({
          label: 'I manually confirm the consent setup is verified (this is NOT an automated check)',
          description:
            'This is an operator attestation — a human checking a box — not proof of a working integration. The ' +
            'site cannot verify your CMP dashboard settings or test your banner in a real browser for you. Check ' +
            'this only once true: EITHER (a) you serve EEA/UK/Swiss visitors and have enabled Google Consent Mode / ' +
            '"Support GCM" in your CMP\'s own dashboard, run its built-in verification check, AND opened the site in ' +
            'a real browser to confirm the banner blocks analytics/ads until you accept, OR (b) you have confirmed ' +
            'you do not need a CMP for your actual audience. This checkbox alone does nothing: if the provider ' +
            'above is "None", or the required ID/script field is empty, ads stay disabled no matter what this says ' +
            '— see src/lib/ads.ts.',
          defaultValue: false,
        }),

        // --- Ads (disabled by default; enable only after AdSense approval) ---
        adsEnabled: fields.checkbox({
          label: 'Ad serving enabled',
          description:
            'Master switch. Keep OFF until AdSense has approved this account AND, if you serve EEA/UK/CH visitors, ' +
            '"CMP verified for personalized ads" above is checked. Ads also require a valid ad-unit ID per placement below.',
          defaultValue: false,
        }),
        adsensePublisherId: fields.text({
          label: 'AdSense publisher ID (ca-pub-XXXXXXXXXXXXXXXX)',
          description:
            'Also used, independently of ad serving, for the google-adsense-account ownership-verification meta tag.',
          defaultValue: '',
        }),
        searchConsoleVerification: fields.text({
          label: 'Google Search Console verification code',
          description:
            'The "content" value of the google-site-verification meta tag from Search Console — separate from AdSense verification.',
          defaultValue: '',
        }),
        adUnitHomeMid: fields.text({
          label: 'Ad unit ID — homepage (mid-page)',
          description: 'The numeric ad-unit ID from AdSense for this placement, e.g. 1234567890. Leave blank to disable just this slot.',
          defaultValue: '',
        }),
        adUnitArticleBottom: fields.text({
          label: 'Ad unit ID — end of article',
          defaultValue: '',
        }),
        adUnitAppBottom: fields.text({
          label: 'Ad unit ID — end of app info page',
          defaultValue: '',
        }),
        adsTxtLines: fields.text({
          label: 'ads.txt lines',
          description:
            'One entry per line, e.g. "google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0"',
          multiline: true,
          defaultValue: '',
        }),
      },
    }),

    aboutPage: singleton({
      label: 'About Page',
      path: 'src/content/legal/about',
      format: { contentField: 'body' },
      schema: {
        seoTitle: fields.text({ label: 'SEO title', defaultValue: '' }),
        seoDescription: fields.text({ label: 'SEO description', defaultValue: '' }),
        body: fields.markdoc({
          label: 'Body (published as-is — write this for readers, not for other editors)',
        }),
      },
    }),

    privacyPage: singleton({
      label: 'Privacy Policy',
      path: 'src/content/legal/privacy',
      format: { contentField: 'body' },
      schema: {
        seoTitle: fields.text({ label: 'SEO title', defaultValue: '' }),
        seoDescription: fields.text({ label: 'SEO description', defaultValue: '' }),
        policyReviewDate: fields.date({
          label: 'Policy last reviewed on',
          description: 'Set this explicitly each time a human reviews the policy. Shown on the public page. Leave unset and the page will say so.',
        }),
        body: fields.markdoc({
          label: 'Additional notes (published as-is, appended after the auto-generated disclosures — leave empty if you have nothing to add)',
        }),
      },
    }),

    termsPage: singleton({
      label: 'Terms Page',
      path: 'src/content/legal/terms',
      format: { contentField: 'body' },
      schema: {
        seoTitle: fields.text({ label: 'SEO title', defaultValue: '' }),
        seoDescription: fields.text({ label: 'SEO description', defaultValue: '' }),
        body: fields.markdoc({
          label: 'Body (published as-is — write this for readers, not for other editors)',
        }),
      },
    }),
  },

  collections: {
    categories: collection({
      label: 'Categories',
      slugField: 'name',
      path: 'src/content/categories/*',
      format: { data: 'json' },
      schema: {
        name: fields.slug({ name: { label: 'Name' } }),
        description: fields.text({ label: 'Description', multiline: true, defaultValue: '' }),
      },
    }),

    authors: collection({
      label: 'Authors',
      slugField: 'name',
      path: 'src/content/authors/*',
      format: { data: 'json' },
      schema: {
        name: fields.slug({ name: { label: 'Name' } }),
        bio: fields.text({ label: 'Bio', multiline: true, defaultValue: '' }),
        kind: fields.select({ label: 'Author type', options: [{label: 'Person', value: 'Person'}, {label: 'Organization', value: 'Organization'}], defaultValue: 'Person' }),
        avatar: fields.image({
          label: 'Avatar',
          directory: 'src/assets/authors',
          publicPath: '../../assets/authors/',
        }),
        sample: fields.checkbox({
          label: 'Sample author (always excluded from production build)',
          defaultValue: false,
        }),
      },
    }),

    apps: collection({
      label: 'Apps',
      slugField: 'name',
      path: 'src/content/apps/*',
      format: { contentField: 'body' },
      schema: {
        name: fields.slug({ name: { label: 'App name' } }),
        description: fields.text({ label: 'Short description (used in listings & SEO)', multiline: true }),
        category: fields.relationship({
          label: 'Category',
          collection: 'categories',
        }),
        developer: fields.text({ label: 'Developer / publisher name', defaultValue: '' }),
        officialLink: fields.url({
          label: 'Official link (app store or developer site only)',
          description: 'Must be the official, authorized source. Do not link to unofficial mirrors.',
        }),
        platforms: fields.multiselect({
          label: 'Platforms',
          options: [
            { label: 'Android', value: 'android' },
            { label: 'iOS', value: 'ios' },
            { label: 'Windows', value: 'windows' },
            { label: 'macOS', value: 'macos' },
            { label: 'Web', value: 'web' },
          ],
          defaultValue: [],
        }),
        currentVersion: fields.text({ label: 'Current version (as reported by official source)', defaultValue: '' }),
        lastUpdated: fields.date({ label: 'Last updated (per official source)' }),
        fileSize: fields.text({ label: 'File size (as reported by official source)', defaultValue: '' }),
        coverImage: fields.image({
          label: 'Cover image',
          directory: 'src/assets/apps',
          publicPath: '../../assets/apps/',
        }),
        coverImageAlt: fields.text({ label: 'Cover image alt text', defaultValue: '' }),
        coverImageCredit: fields.text({ label: 'Image credit and license', defaultValue: '' }),
        coverImageSource: fields.url({ label: 'Image source URL' }),
        seoTitle: fields.text({ label: 'SEO title', defaultValue: '' }),
        seoDescription: fields.text({ label: 'SEO description', defaultValue: '' }),
        draft: fields.checkbox({ label: 'Draft (hidden from production build)', defaultValue: true }),
        sample: fields.checkbox({
          label: 'Sample content (always excluded from production build)',
          defaultValue: false,
        }),
        body: fields.markdoc({ label: 'Body' }),
      },
    }),

    articles: collection({
      label: 'Articles',
      slugField: 'title',
      path: 'src/content/articles/*',
      format: { contentField: 'body' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        type: fields.select({
          label: 'Article type',
          options: [
            { label: 'Upcoming game / news feature', value: 'news' },
            { label: 'Review', value: 'review' },
            { label: 'Tutorial', value: 'tutorial' },
            { label: 'Troubleshooting', value: 'troubleshooting' },
          ],
          defaultValue: 'review',
        }),
        description: fields.text({ label: 'Description (used in listings & SEO)', multiline: true }),
        category: fields.relationship({ label: 'Category', collection: 'categories' }),
        author: fields.relationship({ label: 'Author', collection: 'authors' }),
        relatedApp: fields.relationship({
          label: 'Related app (optional)',
          collection: 'apps',
        }),
        publishDate: fields.date({ label: 'Publish date' }),
        updatedDate: fields.date({ label: 'Updated date (optional)' }),
        coverImage: fields.image({
          label: 'Cover image',
          directory: 'src/assets/articles',
          publicPath: '../../assets/articles/',
        }),
        coverImageAlt: fields.text({ label: 'Cover image alt text', defaultValue: '' }),
        coverImageCredit: fields.text({ label: 'Image credit and license', defaultValue: '' }),
        coverImageSource: fields.url({ label: 'Image source URL' }),
        seoTitle: fields.text({ label: 'SEO title', defaultValue: '' }),
        seoDescription: fields.text({ label: 'SEO description', defaultValue: '' }),
        draft: fields.checkbox({ label: 'Draft (hidden from production build)', defaultValue: true }),
        sample: fields.checkbox({
          label: 'Sample content (always excluded from production build)',
          defaultValue: false,
        }),
        body: fields.markdoc({ label: 'Body' }),
      },
    }),
  },
});
