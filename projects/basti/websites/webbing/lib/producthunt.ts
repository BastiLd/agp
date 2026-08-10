import { GraphQLClient } from 'graphql-request'

const PRODUCTHUNT_API_URL = 'https://api.producthunt.com/v2/api/graphql'

interface ProductHuntProduct {
  id: string
  name: string
  tagline: string
  description: string
  url: string
  votesCount: number
  createdAt: string
  topics: {
    edges: Array<{
      node: {
        name: string
      }
    }>
  }
}

interface ProductHuntResponse {
  posts: {
    edges: Array<{
      node: ProductHuntProduct
    }>
  }
}

export class ProductHuntClient {
  private client: GraphQLClient

  constructor(token?: string) {
    const apiToken = token || process.env.PRODUCTHUNT_TOKEN

    if (!apiToken) {
      throw new Error('PRODUCTHUNT_TOKEN is not set')
    }

    this.client = new GraphQLClient(PRODUCTHUNT_API_URL, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    })
  }

  async fetchProducts(limit: number = 20, after?: string): Promise<ProductHuntProduct[]> {
    const query = `
      query GetPosts($first: Int!, $after: String) {
        posts(first: $first, after: $after, order: VOTES) {
          edges {
            node {
              id
              name
              tagline
              description
              url
              votesCount
              createdAt
              topics {
                edges {
                  node {
                    name
                  }
                }
              }
            }
          }
        }
      }
    `

    try {
      const data = (await this.client.request<ProductHuntResponse>(query, {
        first: limit,
        after,
      })) as ProductHuntResponse

      return data.posts.edges.map((edge) => edge.node)
    } catch (error) {
      console.error('Error fetching Product Hunt products:', error)
      throw error
    }
  }

  async syncProducts(limit: number = 10) {
    const products = await this.fetchProducts(limit)

    // Transform Product Hunt products to our ideas format
    return products.map((product) => ({
      title: product.name,
      slug: product.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      short_desc: product.tagline,
      long_desc: product.description,
      tags: product.topics.edges.map((edge) => edge.node.name),
      source_url: product.url,
      producthunt_id: product.id,
      launch_date: new Date(product.createdAt).toISOString().split('T')[0],
      published: false, // Start as unpublished, admin can review
    }))
  }
}

export function createProductHuntClient(token?: string) {
  return new ProductHuntClient(token)
}

