import { createAdminClient } from '../lib/supabase/admin'

async function seed() {
  console.log('🌱 Starting seed process...')

  const supabase = createAdminClient()

  try {
    // 1. Create Admin User in auth (we'll need to do this manually or via Supabase dashboard)
    // For now, we'll create a user record that can be linked to an auth user
    console.log('\n📝 Step 1: Creating admin user record...')
    
    // Note: In production, you'd create the auth user first via Supabase Auth
    // Then link it to this user record. For seeding, we'll create a placeholder.
    const adminEmail = 'admin@webbin.com'
    
    // Check if admin user exists
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .single()

    if (!existingAdmin) {
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .insert({
          email: adminEmail,
          role: 'admin',
          is_pro: true,
          // supabase_auth_id will be set when you create the auth user
        })
        .select()
        .single()

      if (adminError) {
        console.error('❌ Error creating admin user:', adminError)
      } else {
        console.log('✅ Admin user created:', adminUser.email)
        console.log('   ⚠️  Remember to create auth user in Supabase Dashboard and link supabase_auth_id')
      }
    } else {
      console.log('✅ Admin user already exists')
    }

    // 2. Create Tags
    console.log('\n🏷️  Step 2: Creating tags...')
    const tags = [
      'SaaS',
      'Productivity',
      'E-commerce',
      'Marketing',
      'Design',
      'Developer Tools',
      'Analytics',
      'AI/ML',
    ]

    const tagMap: Record<string, string> = {}

    for (const tagName of tags) {
      const { data: tag, error } = await supabase
        .from('tags')
        .upsert({ name: tagName }, { onConflict: 'name' })
        .select()
        .single()

      if (error) {
        console.error(`❌ Error inserting tag ${tagName}:`, error)
      } else {
        console.log(`   ✅ Tag: ${tagName}`)
        tagMap[tagName] = tag.id
      }
    }

    // 3. Create 10 Example Ideas
    console.log('\n💡 Step 3: Creating example ideas...')
    const ideas = [
      {
        title: 'Notion AI - Workspace Intelligence',
        slug: 'notion-ai-workspace-intelligence',
        short_desc:
          'AI-powered workspace that helps teams collaborate smarter with intelligent automation and insights.',
        long_desc:
          'Notion AI transforms how teams work by integrating AI directly into your workspace. It helps with writing, summarizing, brainstorming, and automating repetitive tasks. Teams report 30% time savings on documentation and planning.',
        tags: ['SaaS', 'Productivity', 'AI/ML'],
        screenshot_url: 'https://via.placeholder.com/1200x800/0ea5e9/ffffff?text=Notion+AI',
        source_url: 'https://www.notion.so/product/ai',
        producthunt_id: 'ph123456',
        launch_date: '2023-11-01',
        monthly_revenue_estimate: 500000,
        monthly_users_estimate: 5000000,
        time_to_revenue_days: 90,
        published: true,
      },
      {
        title: 'Stripe Tax - Automated Tax Compliance',
        slug: 'stripe-tax-automated-compliance',
        short_desc:
          'Automatically calculate and collect sales tax, VAT, and GST in over 50 countries with Stripe Tax.',
        long_desc:
          'Stripe Tax removes the complexity of tax compliance for businesses selling globally. It automatically determines tax rates, collects taxes, and generates reports for filing. Used by thousands of businesses to stay compliant.',
        tags: ['SaaS', 'Finance', 'Developer Tools'],
        screenshot_url: 'https://via.placeholder.com/1200x800/635bff/ffffff?text=Stripe+Tax',
        source_url: 'https://stripe.com/tax',
        producthunt_id: 'ph123457',
        launch_date: '2022-06-15',
        monthly_revenue_estimate: 2000000,
        monthly_users_estimate: 100000,
        time_to_revenue_days: 60,
        published: true,
      },
      {
        title: 'Figma Dev Mode - Design to Code',
        slug: 'figma-dev-mode-design-code',
        short_desc:
          'Streamline the handoff from design to development with Dev Mode, built for developers.',
        long_desc:
          'Figma Dev Mode provides developers with everything they need to translate designs into code. It includes specs, measurements, and code snippets. Reduces handoff time by 50% and improves design implementation accuracy.',
        tags: ['Design', 'Developer Tools', 'SaaS'],
        screenshot_url: 'https://via.placeholder.com/1200x800/a259ff/ffffff?text=Figma+Dev+Mode',
        source_url: 'https://www.figma.com/dev-mode',
        producthunt_id: 'ph123458',
        launch_date: '2023-06-20',
        monthly_revenue_estimate: 15000000,
        monthly_users_estimate: 2000000,
        time_to_revenue_days: 120,
        published: true,
      },
      {
        title: 'Vercel Analytics - Real User Monitoring',
        slug: 'vercel-analytics-real-user-monitoring',
        short_desc:
          'Understand your web app performance with real user metrics, Core Web Vitals, and custom events.',
        long_desc:
          'Vercel Analytics provides comprehensive insights into your application performance. Track Core Web Vitals, user sessions, and custom events. Helps teams identify and fix performance issues before they impact users.',
        tags: ['Analytics', 'Developer Tools', 'SaaS'],
        screenshot_url: 'https://via.placeholder.com/1200x800/000000/ffffff?text=Vercel+Analytics',
        source_url: 'https://vercel.com/analytics',
        producthunt_id: 'ph123459',
        launch_date: '2023-03-10',
        monthly_revenue_estimate: 3000000,
        monthly_users_estimate: 500000,
        time_to_revenue_days: 45,
        published: true,
      },
      {
        title: 'Shopify Markets - Global Commerce',
        slug: 'shopify-markets-global-commerce',
        short_desc:
          'Sell internationally with localized experiences, multi-currency, and automated compliance.',
        long_desc:
          'Shopify Markets enables merchants to expand globally with ease. It handles currency conversion, localized pricing, and international shipping. Merchants see 40% increase in international sales on average.',
        tags: ['E-commerce', 'SaaS', 'Finance'],
        screenshot_url: 'https://via.placeholder.com/1200x800/95bf47/ffffff?text=Shopify+Markets',
        source_url: 'https://www.shopify.com/markets',
        producthunt_id: 'ph123460',
        launch_date: '2021-09-01',
        monthly_revenue_estimate: 50000000,
        monthly_users_estimate: 10000000,
        time_to_revenue_days: 180,
        published: true,
      },
      {
        title: 'Linear - Issue Tracking for Teams',
        slug: 'linear-issue-tracking-teams',
        short_desc:
          'The issue tracking tool you will enjoy using. Built for high-performance teams.',
        long_desc:
          'Linear combines issue tracking, project management, and team collaboration in one beautiful interface. Used by teams at companies like Vercel, Stripe, and Figma. Reduces context switching and improves team velocity.',
        tags: ['SaaS', 'Productivity', 'Developer Tools'],
        screenshot_url: 'https://via.placeholder.com/1200x800/5e6ad2/ffffff?text=Linear',
        source_url: 'https://linear.app',
        producthunt_id: 'ph123461',
        launch_date: '2020-01-15',
        monthly_revenue_estimate: 8000000,
        monthly_users_estimate: 500000,
        time_to_revenue_days: 90,
        published: true,
      },
      {
        title: 'Midjourney - AI Image Generation',
        slug: 'midjourney-ai-image-generation',
        short_desc:
          'Create stunning images from text descriptions using advanced AI technology.',
        long_desc:
          'Midjourney is an AI-powered image generation tool that creates beautiful, artistic images from text prompts. Used by designers, marketers, and creators worldwide. Generates millions of images monthly.',
        tags: ['AI/ML', 'Design', 'SaaS'],
        screenshot_url: 'https://via.placeholder.com/1200x800/26a269/ffffff?text=Midjourney',
        source_url: 'https://www.midjourney.com',
        producthunt_id: 'ph123462',
        launch_date: '2022-07-12',
        monthly_revenue_estimate: 25000000,
        monthly_users_estimate: 15000000,
        time_to_revenue_days: 30,
        published: true,
      },
      {
        title: 'Loom - Async Video Communication',
        slug: 'loom-async-video-communication',
        short_desc:
          'Record and share video messages of your screen, camera, or both. Faster than typing.',
        long_desc:
          'Loom makes communication more personal and efficient through video. Teams use it for async standups, product demos, and feedback. Reduces meeting time by 30% and improves clarity of communication.',
        tags: ['SaaS', 'Productivity'],
        screenshot_url: 'https://via.placeholder.com/1200x800/625df5/ffffff?text=Loom',
        source_url: 'https://www.loom.com',
        producthunt_id: 'ph123463',
        launch_date: '2016-01-01',
        monthly_revenue_estimate: 15000000,
        monthly_users_estimate: 20000000,
        time_to_revenue_days: 365,
        published: true,
      },
      {
        title: 'Resend - Email API for Developers',
        slug: 'resend-email-api-developers',
        short_desc:
          'The email API for developers. Build, test, and send transactional emails at scale.',
        long_desc:
          'Resend provides a modern email API that developers love. It offers great deliverability, beautiful templates, and simple integration. Used by thousands of companies to send millions of emails monthly.',
        tags: ['Developer Tools', 'SaaS', 'Marketing'],
        screenshot_url: 'https://via.placeholder.com/1200x800/ff6b6b/ffffff?text=Resend',
        source_url: 'https://resend.com',
        producthunt_id: null,
        launch_date: '2023-01-10',
        monthly_revenue_estimate: 500000,
        monthly_users_estimate: 100000,
        time_to_revenue_days: 60,
        published: true,
      },
      {
        title: 'Cal.com - Open Source Scheduling',
        slug: 'cal-com-open-source-scheduling',
        short_desc:
          'Open source scheduling infrastructure for everyone. Self-hosted or cloud.',
        long_desc:
          'Cal.com is the open source alternative to Calendly. It offers scheduling, timezone handling, and integrations. Used by teams who want control over their scheduling infrastructure and data.',
        tags: ['SaaS', 'Productivity'],
        screenshot_url: 'https://via.placeholder.com/1200x800/292929/ffffff?text=Cal.com',
        source_url: 'https://cal.com',
        producthunt_id: null,
        launch_date: '2021-01-01',
        monthly_revenue_estimate: 2000000,
        monthly_users_estimate: 500000,
        time_to_revenue_days: 120,
        published: true,
      },
    ]

    const ideaMap: Record<string, string> = {}

    for (const idea of ideas) {
      const { data: insertedIdea, error } = await supabase
        .from('ideas')
        .upsert(
          {
            title: idea.title,
            slug: idea.slug,
            short_desc: idea.short_desc,
            long_desc: idea.long_desc,
            tags: idea.tags,
            screenshot_url: idea.screenshot_url,
            source_url: idea.source_url,
            producthunt_id: idea.producthunt_id,
            launch_date: idea.launch_date,
            monthly_revenue_estimate: idea.monthly_revenue_estimate,
            monthly_users_estimate: idea.monthly_users_estimate,
            time_to_revenue_days: idea.time_to_revenue_days,
            published: idea.published,
          },
          { onConflict: 'slug' }
        )
        .select()
        .single()

      if (error) {
        console.error(`❌ Error inserting idea ${idea.title}:`, error)
      } else {
        console.log(`   ✅ Idea: ${idea.title}`)
        ideaMap[idea.slug] = insertedIdea.id

        // Link tags to idea via idea_tags table
        for (const tagName of idea.tags) {
          const tagId = tagMap[tagName]
          if (tagId && insertedIdea.id) {
            await supabase
              .from('idea_tags')
              .upsert(
                {
                  idea_id: insertedIdea.id,
                  tag_id: tagId,
                },
                { onConflict: 'idea_id,tag_id' }
              )
          }
        }
      }
    }

    console.log('\n✅ Seed process completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`   - Admin user: ${adminEmail}`)
    console.log(`   - Tags created: ${tags.length}`)
    console.log(`   - Ideas created: ${ideas.length}`)
    console.log('\n⚠️  Next steps:')
    console.log('   1. Create admin auth user in Supabase Dashboard')
    console.log('   2. Link supabase_auth_id to the admin user record')
    console.log('   3. Run: npm run dev')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }
}

seed()
  .then(() => {
    console.log('\n🎉 Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Seed failed:', error)
    process.exit(1)
  })
