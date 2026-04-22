import { config as BLOG } from '@/lib/server/config'

import { idToUuid } from 'notion-utils'
import dayjs from 'dayjs'
import api from '@/lib/server/notion-api'
import getAllPageIds from './getAllPageIds'
import getPageProperties from './getPageProperties'
import filterPublishedPosts from './filterPublishedPosts'

/**
 * @param {{ includePages: boolean }} - false: posts only / true: include pages
 */
export async function getAllPosts({ includePages = false }) {
  const notionPageId = process.env.NOTION_PAGE_ID
  if (!notionPageId) {
    throw new Error('Missing NOTION_PAGE_ID. Set it to the 32-character ID of your Notion database page.')
  }

  const id = idToUuid(notionPageId)
  if (!id) {
    throw new Error(
      `Invalid NOTION_PAGE_ID "${notionPageId}". It must be a valid Notion page ID or page URL.`
    )
  }

  const response = await api.getPage(id)

  const collection = Object.values(response.collection)[0]?.value
  const collectionQuery = response.collection_query
  const block = response.block
  const schema = collection?.schema

  const rawMetadata = block?.[id]?.value

  if (!collection || !schema || !collectionQuery) {
    throw new Error(
      `NOTION_PAGE_ID "${notionPageId}" did not return a usable Notion database payload. ` +
        `Check that the page exists, is shared publicly, or that NOTION_ACCESS_TOKEN is valid for private content.`
    )
  }

  if (rawMetadata && rawMetadata.type !== 'collection_view_page' && rawMetadata.type !== 'collection_view') {
    throw new Error(
      `NOTION_PAGE_ID "${notionPageId}" must point to a Notion database page, but received block type "${rawMetadata.type}".`
    )
  }

  // Construct Data
  const pageIds = getAllPageIds(collectionQuery)
  const data = []
  for (let i = 0; i < pageIds.length; i++) {
    const id = pageIds[i]
    const properties = (await getPageProperties(id, block, schema)) || null

    // Add fullwidth to properties
    properties.fullWidth = block[id].value?.format?.page_full_width ?? false
    // Convert date (with timezone) to unix milliseconds timestamp
    properties.date = (
      properties.date?.start_date ? dayjs.tz(properties.date?.start_date) : dayjs(block[id].value?.created_time)
    ).valueOf()

    data.push(properties)
  }

  // remove all the the items doesn't meet requirements
  const posts = filterPublishedPosts({ posts: data, includePages })

  // Sort by date
  if (BLOG.sortByDate) {
    posts.sort((a, b) => b.date - a.date)
  }
  return posts
}
