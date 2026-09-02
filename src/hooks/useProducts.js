import { useEffect } from "react";
import { toast } from "react-toastify";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import { useGetProductsQuery } from "../services/invoiceApi";

/**
 * GET /products — RTK Query (Postman: http://localhost:5001/products).
 * Usage: const { products, isLoading } = useProducts()
 */
export function useProducts() {
  const query = useGetProductsQuery();

  useEffect(() => {
    if (query.isError) {
      toast.error(getErrorMessage(query.error, "Failed to load products"));
    }
  }, [query.isError, query.error]);

  return {
    products: query.data?.products ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
