import { Merriweather } from 'next/font/google'
import { Tagesschrift } from 'next/font/google'
import { Noto_Serif } from 'next/font/google'

export const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
})

export const tagesschrift = Tagesschrift({
  subsets: ['latin'],
  weight: ['400'],
})

export const notoserif = Noto_Serif ({
    subsets: ['latin'],
    weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
})