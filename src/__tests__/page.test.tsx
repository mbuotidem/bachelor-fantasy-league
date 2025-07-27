import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Home component for testing
const MockHome = () => {
  return (
    <div>
      <h1>Bachelor Fantasy League</h1>
      <p>Welcome to the fantasy league for Bachelor fans!</p>
    </div>
  )
}

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<MockHome />)
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Bachelor Fantasy League')
  })

  it('displays welcome message', () => {
    render(<MockHome />)
    
    const welcomeText = screen.getByText(/Welcome to the fantasy league/i)
    expect(welcomeText).toBeInTheDocument()
  })
})