'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface LimitDropdownProps {
  currentLimit: number;
}

export default function LimitDropdown({ currentLimit }: LimitDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLimitChange = (newLimit: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('limit', newLimit);
    params.set('page', '1'); // Reset to first page when changing limit
    router.push(`?${params.toString()}`);
  };

  return (
    <select 
      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
      value={currentLimit.toString()}
      onChange={(e) => handleLimitChange(e.target.value)}
    >
      <option value="10">10 per page</option>
      <option value="20">20 per page</option>
      <option value="50">50 per page</option>
    </select>
  );
}
