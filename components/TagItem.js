import Link from 'next/link'

const TagItem = ({ tag }) => (
  <Link href={`/tag/${encodeURIComponent(tag)}`}>
    <p className="mr-1 rounded-full border px-2 py-1 text-sm leading-none dark:border-gray-600">
      {tag}
    </p>
  </Link>
)

export default TagItem
