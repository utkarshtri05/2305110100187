# Stage 1

## Priority Selection Strategy

The priority inbox treats unread notifications as the main candidate pool and
assigns an importance weight to every notification type:

- Placement: 3
- Result: 2
- Event: 1

The final ordering rule is:

1. Higher type weight first
2. Newer timestamp first when the type weight is the same

This keeps job-related updates ahead of result updates and pushes both above
general event announcements.

## Efficient Top N Maintenance

To maintain the top `n` unread notifications efficiently while new items keep
arriving:

1. Parse every incoming notification into a comparable tuple:
   `(typeWeight, timestamp)`
2. Keep a min-heap of size `n`
3. Push the first `n` unread notifications into the heap
4. For every later unread notification:
   - compare it with the heap root
   - replace the root only if the new item has a better score
5. Read the heap contents in descending order before displaying them

This avoids sorting the entire stream each time and keeps the update cost close
to `O(log n)` per incoming notification after the heap is warm.

## Complexity

- Full scan with sorting: `O(m log m)` where `m` is the unread candidate count
- Heap-based running maintenance: `O(m log n)` with `n` fixed to the requested
  priority window
- Space complexity: `O(n)` for the maintained priority heap

## Stage 2 Frontend Notes

The frontend implementation extends the Stage 1 idea with:

- A dedicated All Notifications page
- A separate Priority Inbox page
- Protected API consumption using a bearer token
- Server-side pagination and notification-type filtering
- Local viewed-state persistence so the UI can distinguish new vs. reviewed items
- Structured logging around API requests, filters, pagination, refresh actions,
  and read-state changes
