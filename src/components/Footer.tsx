import styles from './Footer.module.css'

export const Footer = () => {
  return (
    <p className={styles.footer}>
      <a href="https://github.com/lewispolansky/lewispolansky.com" target="_blank" rel="noopener noreferrer">
        View the source code on GitHub
      </a>
      {' '}&copy; {new Date().getFullYear()} Lewis Polansky. All rights reserved.      
    </p>
  )
}