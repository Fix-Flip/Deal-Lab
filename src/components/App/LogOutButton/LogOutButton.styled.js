import styled from 'styled-components';

export const StyledLogOutButton = styled.button`
  font-size: 2rem; 
  text-transform: uppercase;
  padding: 2rem 0;
  font-weight: bold;
  letter-spacing: 0.5rem;
  color: ${({ theme }) => theme.primaryDark};
  text-decoration: none;
  transition: color 0.3s linear;
  background: transparent;
  border: none;
  display: flex;
  
  cursor: pointer;

  @media (max-width: ${({ theme }) => theme.mobile}) {
      font-size: 1.5rem;
      text-align: center;
    }

  &:hover {
    color: ${({ theme }) => theme.primaryHover};
  }
`;