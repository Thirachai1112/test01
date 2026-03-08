const path = require('path');
const { v4: uuidv4 } = require('uuid');

let supabase = null;

const storageMode = String(process.env.STORAGE_MODE || '').trim().toLowerCase();
const hasSupabaseCredentials = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const useSupabaseStorage = hasSupabaseCredentials && storageMode !== 'local';

if (useSupabaseStorage) {
    // Lazy load through require to keep local mode dependency-light.
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false }
    });
}

const BUCKETS = {
    borrowing: process.env.SUPABASE_BUCKET_BORROWING || 'borrowing',
    repairs: process.env.SUPABASE_BUCKET_REPAIRS || 'repairs',
    reports: process.env.SUPABASE_BUCKET_REPORTS || 'reports',
    qrcodes: process.env.SUPABASE_BUCKET_QRCODES || 'qrcodes',
    uploads: process.env.SUPABASE_BUCKET_UPLOADS || 'uploads'
};

const getFileExt = (fileName = '') => path.extname(fileName || '').toLowerCase();

const resolveBucket = (type) => {
    if (!BUCKETS[type]) {
        throw new Error(`Unknown storage type: ${type}`);
    }
    return BUCKETS[type];
};

const generateObjectName = (fileName = '') => `${uuidv4()}${getFileExt(fileName) || ''}`;

async function uploadBufferToSupabase({ buffer, mimeType, bucketType, objectName }) {
    if (!supabase) {
        throw new Error('Supabase storage is not configured');
    }

    const bucket = resolveBucket(bucketType);
    const { error } = await supabase.storage.from(bucket).upload(objectName, buffer, {
        contentType: mimeType || 'application/octet-stream',
        upsert: false
    });

    if (error) {
        throw new Error(`Supabase upload failed (${bucket}/${objectName}): ${error.message}`);
    }

    return { bucket, objectName };
}

async function deleteObjectIfExists(bucketType, objectName) {
    if (!useSupabaseStorage || !objectName) return;
    const bucket = resolveBucket(bucketType);
    await supabase.storage.from(bucket).remove([objectName]);
}

function getPublicObjectUrl(bucketType, objectName) {
    if (!supabase || !objectName) return null;
    const bucket = resolveBucket(bucketType);
    const { data } = supabase.storage.from(bucket).getPublicUrl(objectName);
    return data?.publicUrl || null;
}

module.exports = {
    BUCKETS,
    useSupabaseStorage,
    generateObjectName,
    uploadBufferToSupabase,
    deleteObjectIfExists,
    getPublicObjectUrl
};
