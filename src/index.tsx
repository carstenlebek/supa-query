import {
  QueryClient,
  QueryClientProvider,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { ReactNode, useState } from "react";

// @ts-ignore
import { Database } from "./../../supabase/database.types";
import { FunctionInvokeOptions } from "@supabase/functions-js/dist/module/types";
import React from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

const queryClient = new QueryClient();

export const SupaQueryProvider = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>{children} </QueryClientProvider>
  );
};

export interface Bucket {
  id: string;
  name: string;
  owner: string;
  created_at: string;
  updated_at: string;
  public: boolean;
}

export interface FileObject {
  name: string;
  bucket_id: string;
  owner: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
  buckets: Bucket;
}

export const useFindMany = <T extends keyof Database["public"]["Tables"]>(
  table: T,
  options?: {
    count?: "exact" | "estimated" | "planned";
    range?: { from: number; to: number };
    order?: "id" | "first_name" | "last_name";
    ascending?: boolean;
  } & UseQueryOptions<Database["public"]["Tables"][T]["Row"][]>
) => {
  const supabase = useSupabaseClient<Database>();
  const [count, setCount] = useState<number | null>(null);

  const queryKey = [table, options];

  const queryFn = async () => {
    const { data, error, count } = await supabase
      .from(table as string)
      .select("*", { count: options?.count })
      .range(options?.range?.from || 0, options?.range?.to || 10)
      .order(options?.order || "id", {
        ascending: options?.ascending || false,
      });

    if (error) {
      throw error;
    }

    setCount(count);

    return data;
  };

  return {
    ...useQuery<Database["public"]["Tables"][T]["Row"][]>(
      queryKey,
      queryFn,
      options
    ),
    count,
    pagination: {
      hasNextPage: count ? count > (options?.range?.to || 10) : false,
      hasPreviousPage: options?.range?.from ? options.range.from > 0 : false,
    },
  };
};

export const useFindUnique = <T extends keyof Database["public"]["Tables"]>(
  table: T,
  id: number | string | undefined,
  options?: UseQueryOptions<Database["public"]["Tables"][T]["Row"]>
) => {
  const supabase = useSupabaseClient<Database>();
  const queryKey = [table, id];

  const queryFn = async () => {
    const { data, error } = await supabase
      .from(table as string)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  };

  return useQuery<Database["public"]["Tables"][T]["Row"]>(
    queryKey,
    queryFn,
    options
  );
};

export const useDelete = <T extends keyof Database["public"]["Tables"]>(
  table: T,
  options?: UseMutationOptions<boolean, Error, string | number | undefined>
) => {
  const supabase = useSupabaseClient<Database>();
  const mutationFn = async (args: string | number | undefined) => {
    const { error } = await supabase
      .from(table as string)
      .delete()
      .match({
        id: args,
      });

    if (error) {
      throw error;
    }

    return true;
  };

  return useMutation(mutationFn, options);
};

export const useUpdate = <T extends keyof Database["public"]["Tables"]>(
  table: T,
  options?: UseMutationOptions<
    Database["public"]["Tables"][T]["Row"],
    Error,
    {
      id: string | number;
      data: Database["public"]["Tables"][T] extends { Update: unknown }
        ? Database["public"]["Tables"][T]["Update"]
        : never;
    }
  >
) => {
  const supabase = useSupabaseClient<Database>();
  const mutationFn = async (variables: {
    id: string | number;
    data: Database["public"]["Tables"][T] extends { Update: unknown }
      ? Database["public"]["Tables"][T]["Update"]
      : never;
  }): Promise<Database["public"]["Tables"][T]["Row"]> => {
    const { data, error } = await supabase
      .from(table as string)
      .update(variables.data)
      .eq("id", variables.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data;
  };

  return useMutation<
    Database["public"]["Tables"][T]["Row"],
    Error,
    {
      id: string | number;
      data: Database["public"]["Tables"][T] extends { Update: unknown }
        ? Database["public"]["Tables"][T]["Update"]
        : never;
    }
  >(mutationFn, options);
};

export const useCreate = <T extends keyof Database["public"]["Tables"]>(
  table: T,
  options?: UseMutationOptions<
    Database["public"]["Tables"][T]["Row"],
    Error,
    Database["public"]["Tables"][T] extends { Insert: unknown }
      ? Database["public"]["Tables"][T]["Insert"]
      : never
  >
) => {
  const supabase = useSupabaseClient<Database>();
  const mutationFn = async (
    variables: Database["public"]["Tables"][T] extends { Insert: unknown }
      ? Database["public"]["Tables"][T]["Insert"]
      : never
  ): Promise<Database["public"]["Tables"][T]["Row"]> => {
    const { data, error } = await supabase
      .from(table as string)
      .insert(variables)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data;
  };

  return useMutation<
    Database["public"]["Tables"][T]["Row"],
    Error,
    Database["public"]["Tables"][T] extends { Insert: unknown }
      ? Database["public"]["Tables"][T]["Insert"]
      : never
  >(mutationFn, options);
};

export const useCreateMany = <T extends keyof Database["public"]["Tables"]>(
  table: T,
  options?: UseMutationOptions<
    Database["public"]["Tables"][T]["Row"][],
    Error,
    (Database["public"]["Tables"][T] extends { Insert: unknown }
      ? Database["public"]["Tables"][T]["Insert"]
      : never)[]
  >
) => {
  const supabase = useSupabaseClient<Database>();
  const mutationFn = async (
    variables: (Database["public"]["Tables"][T] extends { Insert: unknown }
      ? Database["public"]["Tables"][T]["Insert"]
      : never)[]
  ): Promise<Database["public"]["Tables"][T]["Row"][]> => {
    const { data, error } = await supabase
      .from(table as string)
      .insert(variables)
      .select("*");

    if (error) {
      throw error;
    }

    return data;
  };

  return useMutation<
    Database["public"]["Tables"][T]["Row"][],
    Error,
    (Database["public"]["Tables"][T] extends { Insert: unknown }
      ? Database["public"]["Tables"][T]["Insert"]
      : never)[]
  >(mutationFn, options);
};

export const useUpsert = <T extends keyof Database["public"]["Tables"]>(
  table: T,
  options?: UseMutationOptions<
    Database["public"]["Tables"][T]["Row"],
    Error,
    {
      id: string | number;
      data: Database["public"]["Tables"][T] extends { Insert: unknown }
        ? Database["public"]["Tables"][T]["Insert"]
        : never;
    }
  >
) => {
  const supabase = useSupabaseClient<Database>();
  const mutationFn = async (variables: {
    id: string | number;
    data: Database["public"]["Tables"][T] extends { Insert: unknown }
      ? Database["public"]["Tables"][T]["Insert"]
      : never;
  }): Promise<Database["public"]["Tables"][T]["Row"]> => {
    const { data, error } = await supabase
      .from(table as string)
      .upsert(variables.data, {
        onConflict: "id",
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data;
  };

  return useMutation<
    Database["public"]["Tables"][T]["Row"],
    Error,
    {
      id: string | number;
      data: Database["public"]["Tables"][T] extends { Insert: unknown }
        ? Database["public"]["Tables"][T]["Insert"]
        : never;
    }
  >(mutationFn, options);
};

export const useEdgeFunction = (
  name: string,
  options?: UseMutationOptions<any, unknown, FunctionInvokeOptions>
) => {
  const supabase = useSupabaseClient<Database>();
  const queryFn = async (args: FunctionInvokeOptions) => {
    const { data, error } = await supabase.functions.invoke(name, args);

    if (error) {
      throw error;
    }

    return data;
  };

  return useMutation(queryFn, options);
};

export const useCreateBucket = (
  options?: UseMutationOptions<
    Pick<Database["storage"]["Tables"]["buckets"]["Row"], "name">,
    Error,
    { name: string; public?: boolean }
  >
) => {
  const supabase = useSupabaseClient<Database>();
  const mutationFn = async (args: {
    name: string;
    public?: boolean;
  }): Promise<
    Pick<Database["storage"]["Tables"]["buckets"]["Row"], "name">
  > => {
    const { data, error } = await supabase.storage.createBucket(args.name, {
      public: !!args.public,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  return useMutation(mutationFn, options);
};

export const useGetBucket = (
  name: string,
  options?: UseQueryOptions<
    Database["storage"]["Tables"]["buckets"]["Row"],
    Error
  >
) => {
  const supabase = useSupabaseClient<Database>();
  const queryFn = async (): Promise<
    Database["storage"]["Tables"]["buckets"]["Row"]
  > => {
    const { data, error } = await supabase.storage.getBucket(name);
    if (error) {
      throw error;
    }

    return data;
  };

  return useQuery<Database["storage"]["Tables"]["buckets"]["Row"], Error>(
    [name],
    queryFn,
    options
  );
};

export const useListBuckets = (
  options?: UseQueryOptions<
    Database["storage"]["Tables"]["buckets"]["Row"][],
    Error
  >
) => {
  const supabase = useSupabaseClient<Database>();
  const queryFn = async (): Promise<
    Database["storage"]["Tables"]["buckets"]["Row"][]
  > => {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      throw error;
    }

    return data;
  };

  return useQuery<Database["storage"]["Tables"]["buckets"]["Row"][], Error>(
    ["listBuckets"],
    queryFn,
    options
  );
};

export const useUpdateBucket = (
  name: string,
  options?: UseMutationOptions<{ message: string }, Error, { public: boolean }>
) => {
  const supabase = useSupabaseClient<Database>();
  const mutationFn = async (args: {
    public: boolean;
  }): Promise<{ message: string }> => {
    const { data, error } = await supabase.storage.updateBucket(name, {
      public: !!args.public,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  return useMutation(mutationFn, options);
};

export const useDeleteBucket = (
  name: string,
  options?: UseMutationOptions<{ message: string }, Error, undefined>
) => {
  const supabase = useSupabaseClient<Database>();
  const mutationFn = async (): Promise<{ message: string }> => {
    const { data, error } = await supabase.storage.deleteBucket(name);

    if (error) {
      throw error;
    }

    return data;
  };

  return useMutation(mutationFn, options);
};

export const useEmptyBucket = (
  name: string,
  options?: UseMutationOptions<{ message: string }, Error, undefined>
) => {
  const supabase = useSupabaseClient<Database>();
  const mutationFn = async (): Promise<{ message: string }> => {
    const { data, error } = await supabase.storage.emptyBucket(name);

    if (error) {
      throw error;
    }

    return data;
  };

  return useMutation(mutationFn, options);
};

export const useUploadFile = (
  bucket: string,
  options?: UseMutationOptions<{ path: string }, Error, any>
) => {
  const supabase = useSupabaseClient<Database>();
  const mutationFn = async (args: {
    path: string;
    fileBody:
      | string
      | ArrayBuffer
      | ArrayBufferView
      | Blob
      | Buffer
      | File
      | FormData
      | ReadableStream
      | ReadableStream
      | URLSearchParams;
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  }): Promise<{ path: string }> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(args.path, args.fileBody, {
        cacheControl: args.cacheControl,
        contentType: args.contentType,
        upsert: args.upsert,
      });

    if (error) {
      throw error;
    }

    return data;
  };

  return useMutation(mutationFn, options);
};

export const useDownloadFile = (
  bucket: string,
  path: string,
  options?: UseQueryOptions<Blob, Error>
) => {
  const supabase = useSupabaseClient<Database>();
  const queryFn = async (): Promise<Blob> => {
    const { data, error } = await supabase.storage.from(bucket).download(path);

    if (error) {
      throw error;
    }

    return data;
  };

  return useQuery<Blob, Error>([bucket, path], queryFn, options);
};

export const useListFiles = (
  bucket: string,
  folder?: string,
  options?: UseQueryOptions<FileObject[], Error> & {
    limit: number;
    offset: number;
    sortBy: keyof Database["storage"]["Tables"]["objects"]["Row"];
    order: "asc" | "desc";
  }
) => {
  const supabase = useSupabaseClient<Database>();
  const queryFn = async (): Promise<FileObject[]> => {
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit: options?.limit,
      offset: options?.offset,
      sortBy: {
        column: options?.sortBy as string,
        order: options?.order,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  };

  return useQuery<FileObject[], Error>(
    [
      bucket,
      folder,
      options?.limit,
      options?.offset,
      options?.sortBy,
      options?.order,
    ],
    queryFn,
    options
  );
};

export const useUpdateFile = (
  bucket: string,
  path: string,
  options?: UseMutationOptions<{ path: string }, Error, any>
) => {
  const supabase = useSupabaseClient<Database>();
  const mutationFn = async (args: {
    fileBody:
      | string
      | ArrayBuffer
      | ArrayBufferView
      | Blob
      | Buffer
      | File
      | FormData
      | ReadableStream
      | ReadableStream
      | URLSearchParams;
    cacheControl?: string;
    contentType?: string;
  }): Promise<{ path: string }> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .update(path, args.fileBody, {
        cacheControl: args.cacheControl,
        contentType: args.contentType,
      });

    if (error) {
      throw error;
    }

    return data;
  };

  return useMutation(mutationFn, options);
};

export const useMoveFile = (
  bucket: string,
  options?: UseMutationOptions<
    { message: string },
    Error,
    { fromPath: string; toPath: string }
  >
) => {
  const supabase = useSupabaseClient<Database>();
  const mutationFn = async (args: {
    fromPath: string;
    toPath: string;
  }): Promise<{ message: string }> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .move(args.fromPath, args.toPath);

    if (error) {
      throw error;
    }

    return data;
  };

  return useMutation(mutationFn, options);
};

export const useCopyFile = (
  bucket: string,
  options?: UseMutationOptions<
    { path: string },
    Error,
    { fromPath: string; toPath: string }
  >
) => {
  const supabase = useSupabaseClient<Database>();
  const mutationFn = async (args: {
    fromPath: string;
    toPath: string;
  }): Promise<{ path: string }> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .copy(args.fromPath, args.toPath);

    if (error) {
      throw error;
    }

    return data;
  };

  return useMutation(mutationFn, options);
};

export const useDeleteFile = (
  bucket: string,
  options?: UseMutationOptions<FileObject, Error, { path: string }>
) => {
  const supabase = useSupabaseClient<Database>();
  const mutationFn = async (args: { path: string }): Promise<FileObject> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([args.path]);

    if (error) {
      throw error;
    }

    return data[0];
  };

  return useMutation(mutationFn, options);
};

export const useDeleteFiles = (
  bucket: string,
  options?: UseMutationOptions<FileObject[], Error, { paths: string[] }>
) => {
  const supabase = useSupabaseClient<Database>();
  const mutationFn = async (args: {
    paths: string[];
  }): Promise<FileObject[]> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(args.paths);

    if (error) {
      throw error;
    }

    return data;
  };

  return useMutation(mutationFn, options);
};

export const useCreateSignedUrl = (
  bucket: string,
  options?: UseMutationOptions<
    { signedUrl: string },
    Error,
    { path: string; expiry: number }
  >
) => {
  const supabase = useSupabaseClient<Database>();
  const mutationFn = async (args: {
    path: string;
    /** The number of seconds until the signed URL expires. For example, 60 for a URL which is valid for one minute.  */
    expiry: number;
  }): Promise<{ signedUrl: string }> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(args.path, args.expiry);

    if (error) {
      throw error;
    }

    return data;
  };

  return useMutation(mutationFn, options);
};

export const useCreateSignedUrls = (
  bucket: string,
  options?: UseMutationOptions<
    {
      error: string | null;
      path: string | null;
      signedUrl: string;
    }[],
    Error,
    { paths: string[]; expiry: number }
  >
) => {
  const supabase = useSupabaseClient<Database>();
  const mutationFn = async (args: {
    paths: string[];
    /** The number of seconds until the signed URL expires. For example, 60 for a URL which is valid for one minute.  */
    expiry: number;
  }): Promise<
    {
      error: string | null;
      path: string | null;
      signedUrl: string;
    }[]
  > => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrls(args.paths, args.expiry);

    if (error) {
      throw error;
    }

    return data;
  };

  return useMutation(mutationFn, options);
};

export const useGetPublicUrl = (
  bucket: string,
  path: string,
  options?: UseQueryOptions<{ publicUrl: string }>
) => {
  const supabase = useSupabaseClient<Database>();
  const queryFn = (): { publicUrl: string } => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return data;
  };

  return useQuery<{ publicUrl: string }>(
    ["getPublicUrl", bucket, path],
    queryFn,
    options
  );
};
