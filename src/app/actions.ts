'use server';

import { revalidatePath } from 'next/cache';

export async function publishMarktbericht(): Promise<{ success: boolean; error?: string }> {
  try {
    revalidatePath('/marktbericht');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
