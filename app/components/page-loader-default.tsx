
import React from 'react';
import  Spinner  from './spinner-default';

const PageLoaderDefault = () => {
    return (
        <div className='w-full h-[60vh] flex flex-row items-center justify-center'>
            <Spinner size="xl" />
        </div>)
};
export default PageLoaderDefault;
