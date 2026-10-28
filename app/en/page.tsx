// The site used to 301 "/" to "/en/", and browsers keep cached 301s. Redirecting "/en/"
// back to "/" would loop for those visitors, so "/en/" serves the homepage with its
// canonical on "/".
export { default, generateMetadata } from "../page";
