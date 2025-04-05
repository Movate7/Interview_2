#!/bin/bash
file="client/src/components/admin/UserManagement.tsx"

# All the permission fields to update
fields=(
  "viewFeedback"
  "viewAnalytics"
  "manageCandidates"
  "managePanels"
  "manageRooms"
  "provideFeedback"
  "manageUsers"
  "managePermissions"
)

for field in "${fields[@]}"; do
  sed -i "s/defaultChecked={currentPermission?.permissions.$field || false}/defaultChecked={currentPermission ? parsePermissions(currentPermission.permissions).$field : false}/g" "$file"
done
