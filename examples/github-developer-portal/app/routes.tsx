import { routes } from 'polen:app'

const Home = () => `Welcome to the GitHub Developer Portal.`

// @ts-ignore
routes[0].children[0].Component = Home

// console.log(routes[0].children)

export { routes }
