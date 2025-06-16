#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs';
import path from 'path';
import { program } from 'commander';

// ---------------------- Supabase Initialization ----------------------
const supabaseUrl = 'https://onyibiwnfwxatadlkygz.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueWliaXduZnd4YXRhZGxreWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4NTA5NzIsImV4cCI6MjA0NzQyNjk3Mn0.fSowEy_-abbGvLM0_A17SiORxgWqAc1G4mV1w7v3d28"
const supabase = createClient(supabaseUrl, supabaseKey)

// Function to insert chapters in batches of `batchSize`
async function insertChapters(chapters, batchSize = 50) {
    for (let i = 0; i < chapters.length; i += batchSize) {
        const batch = chapters.slice(i, i + batchSize);
        const { data, error } = await supabase
            .from('chapters_v1')
            .insert(batch)
            .select()

        if (error) {
            console.error(`Error inserting batch starting at index ${i}:`, error);
            process.exit(1);
        } else {
            console.log(`Inserted batch ${i / batchSize + 1} successfully.`);
        }
    }

    console.log("All chapters inserted successfully.");
}

program
    .name('Insert Chapters CLI')
    .description('Insert chapters data from a JSON file into a Supabase table in batches.')
    .version('1.0.0')
    .argument('<filepath>', 'Path to the JSON file containing chapters data')
    .option('-b, --batch-size <number>', 'Number of chapters to insert per batch', '50')
    .action(async (filepath, options) => {
        try {
            const absPath = path.resolve(filepath);
            if (!fs.existsSync(absPath)) {
                console.error(`Error: File not found at ${absPath}`);
                process.exit(1);
            }

            const fileContent = fs.readFileSync(absPath, 'utf-8');
            let chapters;
            try {
                chapters = JSON.parse(fileContent);
            } catch (parseErr) {
                console.error("Error parsing JSON file:", parseErr.message);
                process.exit(1);
            }

            if (!Array.isArray(chapters)) {
                console.error("Error: The JSON file does not contain an array.");
                process.exit(1);
            }

            const batchSize = parseInt(options.batchSize, 10);
            await insertChapters(chapters, batchSize);
        } catch (error) {
            console.error(`Error inserting chapters: ${error.message}`);
            process.exit(1);
        }
    });

program.parse(process.argv);
