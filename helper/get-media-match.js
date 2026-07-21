/**
 * Using bootstrap's standard to set up reponsive plan https://getbootstrap.com/docs/4.1/layout/grid/
 * @returns {{match, size}|*}
 */
export default function getMediaMatch() {
  let layers = [
    {
      match: "(max-width: 576px)",
      size: 'xs'
    },
    {
      match: "(max-width: 768px)",
      size: 'sm'
    },
    {
      match: "(max-width: 992px)",
      size: 'md'
    },
    {
      match: "(max-width: 1200px)",
      size: 'lg'
    },
    {
      match: "(min-width: 1200px)",
      size: 'xl'
    },
  ]
  for (let i = 0; i < layers.length; i++) {
    let match = window.matchMedia(`${layers[i].match}`);
    if (match.matches){
      return layers[i]
    }
  }
  console.error('window match fail!')
}