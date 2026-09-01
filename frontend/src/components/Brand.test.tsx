import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { Brand } from './Brand'

describe('Brand', () => {
  it('oferece um link acessível para o início', () => {
    render(<MemoryRouter><Brand /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /EduTrack/i })).toHaveAttribute('href', '/')
  })
})
