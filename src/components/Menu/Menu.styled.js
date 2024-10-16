import styled from 'styled-components';

export const StyledMenu = styled.nav`
  display: flex;
  flex-direction: column;
  justify-content: center;

  background: ${({ theme }) => theme.primaryLight};
  height: 55vh;
  max-height: 400px;
  width: 250px; /* Set the desired width */
  max-width: 300px; /* Optional max-width */
  text-align: left;
  font-size: 2rem;
  padding: 2rem;
  position: fixed;
  top: 0;
  z-index: 1;
  border: 5px;
  border-radius: 10px;
  right: 0; /* Position the menu on the right */
  transition: transform 0.3s ease-in-out;
  
  /* Slide in from the right */
  transform: ${({ open }) => (open ? 'translateX(0)' : 'translateX(100%)')};

  @media (max-width: ${({ theme }) => theme.mobile}) {
    width: 100%; /* Full width on mobile */
    max-width: none; /* Remove max-width on mobile */
  }

  a {
    font-size: 1.2rem;
    text-transform: uppercase;
    padding: 1rem 0;
    font-weight: bold;
    letter-spacing: 0.5rem;
    color: ${({ theme }) => theme.primaryDark};
    text-decoration: none;
    transition: color 0.3s linear;

    @media (max-width: ${({ theme }) => theme.mobile}) {
      font-size: 1.5rem;
      text-align: center;
    }

    &:hover {
      color: ${({ theme }) => theme.primaryHover};
    }
  }
`;
