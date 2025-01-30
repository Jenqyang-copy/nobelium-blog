import { useLocale } from '@/lib/locale'
import Container from '@/components/Container'

export default function Page404() {
  const locale = useLocale()

  return (
    <Container>
      <h1 className="text-center text-5xl text-black dark:text-white">404</h1>
      <p className="text-center text-xl text-gray-600 dark:text-gray-300">
        {locale.PAGE.ERROR_404.MESSAGE}
      </p>
    </Container>
  )
}
