import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

export interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart];
      const productExistis = newCart.find(p => p.id === productId);
      const stock = await api.get(`stock/${productId}`);
      const stockAmount = stock.data.amount;
      const currentAmount = productExistis ? productExistis.amount : 0;

      if (currentAmount + 1 > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExistis) {
        productExistis.amount = currentAmount + 1;
      } else {
        const product = await api.get(`products/${productId}`);
        const newProduct = {
          ...product.data,
          amount: 1
        }
        newCart.push(newProduct);
      }

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart]
      const product = updatedCart.find(product => product.id === productId);
      if (product) {
        const updatedList = updatedCart.filter(product => product.id !== productId)
        setCart(updatedList)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedList));
      } else throw Error()
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;
      const newCart = [...cart];
      const productExistis = newCart.find(p => p.id === productId);
      const stock = await (await api.get(`stock/${productId}`)).data.amount;
      const currentAmount = productExistis ? amount : 0;

      if (currentAmount <= 0) return;

      if (currentAmount > stock) {
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

      if (productExistis) {
        productExistis.amount = amount
      }

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
