import PropTypes from 'prop-types'
import Image from 'next/image'
import cn from 'classnames'
import { useConfig } from '@/lib/config'
import useTheme from '@/lib/theme'
import FormattedDate from '@/components/FormattedDate'
import TagItem from '@/components/TagItem'
import NotionRenderer from '@/components/NotionRenderer'
import TableOfContents from '@/components/TableOfContents'

/**
 * A post renderer
 *
 * @param {PostProps} props
 *
 * @typedef {object} PostProps
 * @prop {object}   post       - Post metadata
 * @prop {object}   blockMap   - Post block data
 * @prop {string}   emailHash  - Author email hash (for Gravatar)
 * @prop {boolean} [fullWidth] - Whether in full-width mode
 */
export default function Post(props) {
  const BLOG = useConfig()
  const { post, blockMap, emailHash, fullWidth = false } = props
  const { dark } = useTheme()

  return (
    <article className={cn('flex flex-col', fullWidth ? 'md:px-24' : 'items-center')}>
      <h1
        className={cn('w-full text-3xl font-bold text-black dark:text-white', {
          'max-w-2xl px-4': !fullWidth,
        })}
      >
        {post.title}
      </h1>
      {post.type[0] !== 'Page' && (
        <nav
          className={cn('mt-7 flex w-full items-start text-gray-500 dark:text-gray-400', {
            'max-w-2xl px-4': !fullWidth,
          })}
        >
          <div className="mb-4 flex">
            <a href={BLOG.socialLink || '#'} className="flex">
              <Image
                alt={BLOG.author}
                width={24}
                height={24}
                src={`https://gravatar.com/avatar/${emailHash}`}
                className="rounded-full"
              />
              <p className="ml-2 md:block">{BLOG.author}</p>
            </a>
            <span className="block">&nbsp;/&nbsp;</span>
          </div>
          <div className="mb-4 mr-2 md:ml-0">
            <FormattedDate date={post.date} />
          </div>
          {post.tags && (
            <div className="article-tags flex max-w-full flex-nowrap overflow-x-auto">
              {post.tags.map((tag) => (
                <TagItem key={tag} tag={tag} />
              ))}
            </div>
          )}
        </nav>
      )}
      <div className="-mt-4 flex flex-col items-center self-stretch lg:flex-row lg:items-stretch">
        {!fullWidth && <div className="hidden flex-1 lg:block" />}
        <div className={fullWidth ? 'flex-1 pr-4' : 'w-full max-w-2xl flex-none px-4'}>
          <NotionRenderer recordMap={blockMap} fullPage={false} darkMode={dark} />
        </div>
        <div
          className={cn(
            'order-first w-full max-w-2xl lg:order-[unset] lg:w-auto lg:min-w-[160px] lg:max-w-[unset]',
            fullWidth ? 'flex-none' : 'flex-1'
          )}
        >
          {/* `65px` is the height of expanded nav */}
          {/* TODO: Remove the magic number */}
          <TableOfContents blockMap={blockMap} className="sticky pt-3" style={{ top: '65px' }} />
        </div>
      </div>
    </article>
  )
}

Post.propTypes = {
  post: PropTypes.object.isRequired,
  blockMap: PropTypes.object.isRequired,
  emailHash: PropTypes.string.isRequired,
  fullWidth: PropTypes.bool,
}
