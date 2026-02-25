'use client';

import React from 'react';

interface PromoterManagementProps {
  params: {
    locale: string;
  };
}

export default function PromoterManagement({
  params,
}: PromoterManagementProps) {
  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold'>SIMPLE TEST PAGE</h1>
      <p>If you see this, the component is working!</p>
      <p>Check console for the log message.</p>
      <p>Locale: {params.locale}</p>
    </div>
  );
}
